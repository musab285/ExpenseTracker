from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    CreateProfileSerializer,
    CreateExpenseSerializer,
    UserSerializer,
    CategorySerializer,
    ProfileSerializer,
    ExpenseSerializer,
    IncomeSerializer,
    CreateIncomeSerializer,
    DebtSerializer,
    CreateDebtSerializer,
)
from .models import Profile, Category, Expense, User, Income, Debt
from .filters import ExpenseFilter, IncomeFilter, DebtFilter
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Q, F
from django.db.models.functions import TruncMonth, TruncDay
from django.utils import timezone
from datetime import datetime
from decimal import Decimal
from django.db.models import Value
from django.db.models.fields import CharField as CharFieldModel


class RegisterView(generics.CreateAPIView):
	serializer_class = RegisterSerializer
	permission_classes = [AllowAny]


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'detail': 'Refresh token is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {'detail': 'Successfully logged out.'},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

class ProfileView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Profile.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateProfileSerializer
        return ProfileSerializer

class CategoryView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CategorySerializer
        return CategorySerializer
    
class ExpenseView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = ExpenseFilter

    def get_queryset(self):
        return Expense.objects.filter(profile__user=self.request.user, is_deleted=False)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateExpenseSerializer
        return ExpenseSerializer


class ProfileDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProfileSerializer

    def get_queryset(self):
        return Profile.objects.filter(user=self.request.user)


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CategorySerializer

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)


class ExpenseDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ExpenseSerializer

    def get_queryset(self):
        return Expense.objects.filter(profile__user=self.request.user, is_deleted=False)

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()


class IncomeView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = IncomeFilter

    def get_queryset(self):
        return Income.objects.filter(user=self.request.user, is_deleted=False)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateIncomeSerializer
        return IncomeSerializer


class IncomeDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = IncomeSerializer

    def get_queryset(self):
        return Income.objects.filter(user=self.request.user, is_deleted=False)

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()


class DebtView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = DebtFilter

    def get_queryset(self):
        return Debt.objects.filter(user=self.request.user, is_deleted=False)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateDebtSerializer
        return DebtSerializer


class DebtDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DebtSerializer

    def get_queryset(self):
        return Debt.objects.filter(user=self.request.user, is_deleted=False)

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Total income: sum of all user's incomes (each linked to one profile)
        total_income_data = Income.objects.filter(user=user, is_deleted=False).aggregate(total=Sum('amount'))
        total_income = total_income_data['total'] or Decimal('0.00')
        
        # Total expenses (all user's profiles, excluding soft-deleted)
        total_expenses_data = Expense.objects.filter(profile__user=user, is_deleted=False).aggregate(total=Sum('amount'))
        total_expenses = total_expenses_data['total'] or Decimal('0.00')
        
        # Net balance: income - expenses (debts are separate tracking, not included)
        net_balance = total_income - total_expenses
        
        # Total unpaid debt (informational only, not included in net_balance)
        total_debt_data = Debt.objects.filter(user=user, is_paid=False, is_deleted=False).aggregate(total=Sum('amount'))
        total_debt = total_debt_data['total'] or Decimal('0.00')
        
        # Recent transactions: last 10 of each type (excluding soft-deleted)
        recent_expenses = list(Expense.objects.filter(profile__user=user, is_deleted=False).values(
            'id', 'name', 'amount', 'timestamp', category_name=F('category__name')
        ).order_by('-timestamp')[:10])
        
        recent_incomes = list(Income.objects.filter(user=user, is_deleted=False).values(
            'id', 'name', 'amount', 'timestamp'
        ).annotate(category_name=Value(None, output_field=CharFieldModel())).order_by('-timestamp')[:10])
        
        recent_debts = list(Debt.objects.filter(user=user, is_deleted=False).values(
            'id', 'name', 'amount', 'timestamp'
        ).annotate(category_name=Value(None, output_field=CharFieldModel())).order_by('-timestamp')[:10])
        
        # Merge and sort
        all_transactions = []
        for exp in recent_expenses:
            all_transactions.append({
                'type': 'expense',
                'id': exp['id'],
                'name': exp['name'],
                'amount': exp['amount'],
                'timestamp': exp['timestamp'],
                'category': exp['category_name']
            })
        for inc in recent_incomes:
            all_transactions.append({
                'type': 'income',
                'id': inc['id'],
                'name': inc['name'],
                'amount': inc['amount'],
                'timestamp': inc['timestamp'],
                'category': inc['category_name']
            })
        for debt in recent_debts:
            all_transactions.append({
                'type': 'debt',
                'id': debt['id'],
                'name': debt['name'],
                'amount': debt['amount'],
                'timestamp': debt['timestamp'],
                'category': debt['category_name']
            })
        
        all_transactions.sort(key=lambda x: x['timestamp'], reverse=True)
        recent_transactions = all_transactions[:10]
        
        return Response({
            'total_income': float(total_income),
            'total_expenses': float(total_expenses),
            'total_debt': float(total_debt),
            'net_balance': float(net_balance),
            'recent_transactions': recent_transactions
        })


class ProfileSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            profile = Profile.objects.get(id=pk, user=request.user)
        except Profile.DoesNotExist:
            return Response({'detail': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        now = timezone.now()
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Current month expenses for this profile (excluding soft-deleted)
        current_month_expenses_data = Expense.objects.filter(
            profile=profile,
            timestamp__gte=current_month_start,
            is_deleted=False
        ).aggregate(total=Sum('amount'))
        current_month_expenses = current_month_expenses_data['total'] or Decimal('0.00')
        
        # Current month income for this profile (excluding soft-deleted)
        current_month_income_data = Income.objects.filter(
            profile=profile,
            timestamp__gte=current_month_start,
            is_deleted=False
        ).aggregate(total=Sum('amount'))
        current_month_income = current_month_income_data['total'] or Decimal('0.00')
        
        # Recent transactions for this profile (last 10 expenses, excluding soft-deleted)
        recent_transactions = list(Expense.objects.filter(profile=profile, is_deleted=False).values(
            'id', 'name', 'amount', 'timestamp', category_name=F('category__name')
        ).order_by('-timestamp')[:10])
        
        recent_trans_list = [{
            'id': t['id'],
            'name': t['name'],
            'amount': float(t['amount']),
            'timestamp': t['timestamp'],
            'category': t['category_name']
        } for t in recent_transactions]
        
        return Response({
            'balance': float(profile.balance),
            'current_month_expenses': float(current_month_expenses),
            'current_month_income': float(current_month_income),
            'recent_transactions': recent_trans_list
        })


class ProfileMonthlyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            profile = Profile.objects.get(id=pk, user=request.user)
        except Profile.DoesNotExist:
            return Response({'detail': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get all months with expenses for this profile (excluding soft-deleted)
        expense_data = Expense.objects.filter(profile=profile, is_deleted=False).annotate(
            month=TruncMonth('timestamp')
        ).values('month').annotate(total=Sum('amount')).order_by('-month')
        
        # Get all months with income linked to this profile (excluding soft-deleted)
        income_data = Income.objects.filter(profile=profile, is_deleted=False).annotate(
            month=TruncMonth('timestamp')
        ).values('month').annotate(total=Sum('amount')).order_by('-month')
        
        # Merge by month
        months_dict = {}
        for item in expense_data:
            key = item['month']
            if key not in months_dict:
                months_dict[key] = {'expenses': Decimal('0.00'), 'income': Decimal('0.00')}
            months_dict[key]['expenses'] = item['total']
        
        for item in income_data:
            key = item['month']
            if key not in months_dict:
                months_dict[key] = {'expenses': Decimal('0.00'), 'income': Decimal('0.00')}
            months_dict[key]['income'] = item['total']
        
        result = []
        for month_key in sorted(months_dict.keys(), reverse=True):
            data = months_dict[month_key]
            savings = data['income'] - data['expenses']
            result.append({
                'year': month_key.year,
                'month': month_key.month,
                'income': float(data['income']),
                'debt': 0.0,
                'expenses': float(data['expenses']),
                'savings': float(savings)
            })
        
        return Response(result)


class ProfileMonthlyDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, year, month):
        try:
            profile = Profile.objects.get(id=pk, user=request.user)
        except Profile.DoesNotExist:
            return Response({'detail': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get aggregates for the specific month (excluding soft-deleted)
        expenses_data = Expense.objects.filter(
            profile=profile,
            timestamp__year=year,
            timestamp__month=month,
            is_deleted=False
        ).aggregate(total=Sum('amount'))
        expenses = expenses_data['total'] or Decimal('0.00')
        
        income_data = Income.objects.filter(
            profile=profile,
            timestamp__year=year,
            timestamp__month=month,
            is_deleted=False
        ).aggregate(total=Sum('amount'))
        income = income_data['total'] or Decimal('0.00')
        
        savings = income - expenses
        
        # Expense by category
        expense_by_category = list(Expense.objects.filter(
            profile=profile,
            timestamp__year=year,
            timestamp__month=month,
            is_deleted=False
        ).values('category__name').annotate(total=Sum('amount')).order_by('-total'))
        
        expense_by_category_list = [{
            'category': item['category__name'],
            'total': float(item['total'])
        } for item in expense_by_category]
        
        # All expenses for the month
        top_expenses_qs = Expense.objects.filter(
            profile=profile,
            timestamp__year=year,
            timestamp__month=month,
            is_deleted=False
        ).order_by('-timestamp')
        
        top_expenses = [{
            'id': exp.id,
            'name': exp.name,
            'amount': float(exp.amount),
            'category': exp.category.name,
            'timestamp': exp.timestamp
        } for exp in top_expenses_qs]
        
        # Daily spending
        daily_spending_qs = Expense.objects.filter(
            profile=profile,
            timestamp__year=year,
            timestamp__month=month,
            is_deleted=False
        ).annotate(day=TruncDay('timestamp')).values('day').annotate(total=Sum('amount')).order_by('day')
        
        daily_spending = [{
            'day': item['day'].day,
            'total': float(item['total'])
        } for item in daily_spending_qs]
        
        return Response({
            'year': year,
            'month': month,
            'income': float(income),
            'debt': 0.0,
            'expenses': float(expenses),
            'savings': float(savings),
            'expense_by_category': expense_by_category_list,
            'top_expenses': top_expenses,
            'daily_spending': daily_spending
        })


class ProfileExpensesView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = ExpenseFilter

    def get_queryset(self):
        pk = self.kwargs.get('pk')
        try:
            profile = Profile.objects.get(id=pk, user=self.request.user)
        except Profile.DoesNotExist:
            return Expense.objects.none()
        return Expense.objects.filter(profile=profile, is_deleted=False)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateExpenseSerializer
        return ExpenseSerializer

    def perform_create(self, serializer):
        pk = self.kwargs.get('pk')
        try:
            profile = Profile.objects.get(id=pk, user=self.request.user)
        except Profile.DoesNotExist:
            raise Response({'detail': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer.save(profile=profile)


class ProfileExpensesDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ExpenseSerializer

    def get_queryset(self):
        pk = self.kwargs.get('pk')
        try:
            profile = Profile.objects.get(id=pk, user=self.request.user)
        except Profile.DoesNotExist:
            return Expense.objects.none()
        return Expense.objects.filter(profile=profile, is_deleted=False)

    def get_object(self):
        pk = self.kwargs.get('pk')
        exp_pk = self.kwargs.get('exp_pk')
        try:
            profile = Profile.objects.get(id=pk, user=self.request.user)
            expense = Expense.objects.get(id=exp_pk, profile=profile, is_deleted=False)
            return expense
        except (Profile.DoesNotExist, Expense.DoesNotExist):
            from rest_framework.exceptions import NotFound
            raise NotFound("Expense not found.")

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()