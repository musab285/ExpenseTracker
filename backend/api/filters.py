import django_filters
from .models import Expense, Income, Debt


class ExpenseFilter(django_filters.FilterSet):
    amount_min = django_filters.NumberFilter(field_name='amount', lookup_expr='gte')
    amount_max = django_filters.NumberFilter(field_name='amount', lookup_expr='lte')
    timestamp_date_gte = django_filters.DateFilter(field_name='timestamp__date', lookup_expr='gte')
    timestamp_date_lte = django_filters.DateFilter(field_name='timestamp__date', lookup_expr='lte')
    
    class Meta:
        model = Expense
        fields = ['profile', 'category']


class IncomeFilter(django_filters.FilterSet):
    amount_min = django_filters.NumberFilter(field_name='amount', lookup_expr='gte')
    amount_max = django_filters.NumberFilter(field_name='amount', lookup_expr='lte')
    timestamp_date_gte = django_filters.DateFilter(field_name='timestamp__date', lookup_expr='gte')
    timestamp_date_lte = django_filters.DateFilter(field_name='timestamp__date', lookup_expr='lte')
    
    class Meta:
        model = Income
        fields = []


class DebtFilter(django_filters.FilterSet):
    amount_min = django_filters.NumberFilter(field_name='amount', lookup_expr='gte')
    amount_max = django_filters.NumberFilter(field_name='amount', lookup_expr='lte')
    due_date_gte = django_filters.DateFilter(field_name='due_date', lookup_expr='gte')
    due_date_lte = django_filters.DateFilter(field_name='due_date', lookup_expr='lte')
    
    class Meta:
        model = Debt
        fields = ['is_paid']
