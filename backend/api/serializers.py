from .models import User, Profile, Expense, Category, Income, Debt
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password', 'password2']
        read_only_fields = ['id']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields did not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=validated_data['password']
        )
        return user


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']
        read_only_fields = ['id']

    def create(self, validated_data):
        request = self.context.get('request')
        if not request or not request.user or request.user.is_anonymous:
            raise serializers.ValidationError("Authenticated user is required.")
        category = Category.objects.create(user=request.user, **validated_data)
        return category


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)
    balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = Profile
        fields = ['id', 'user', 'user_id', 'accountType', 'balance']
        read_only_fields = ['id', 'balance']
    
    def create(self, validated_data):
        user_id = validated_data.pop('user_id')
        user = User.objects.get(id=user_id)
        profile = Profile.objects.create(user=user, **validated_data)
        return profile





class ExpenseSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    profile_id = serializers.IntegerField(write_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Expense
        fields = ['id', 'profile', 'profile_id', 'name', 'amount', 'category', 'category_id', 
                  'timestamp', 'payment_type', 'ref_id', 'comments']
        read_only_fields = ['id', 'timestamp']
    
    def create(self, validated_data):
        profile_id = validated_data.pop('profile_id')
        category_id = validated_data.pop('category_id')
        
        profile = Profile.objects.get(id=profile_id)
        category = Category.objects.get(id=category_id)
        
        expense = Expense.objects.create(
            profile=profile,
            category=category,
            **validated_data
        )
        return expense

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if not username or not password:
            raise serializers.ValidationError("Both username and password are required.")

        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError("Invalid username or password.")

        attrs['user'] = user
        return attrs

class CreateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['id', 'accountType']   # remove user from input
        read_only_fields = ['id']

    def create(self, validated_data):
        request = self.context.get('request')
        if not request or not request.user or request.user.is_anonymous:
            raise serializers.ValidationError("Authenticated user is required.")
        return Profile.objects.create(user=request.user, **validated_data)

class CreateExpenseSerializer(serializers.ModelSerializer):
    profile_id = serializers.IntegerField(write_only=True)
    category_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Expense
        fields = [
            'id',
            'profile_id',
            'name',
            'amount',
            'category_id',
            'payment_type',
            'ref_id',
            'timestamp',
            'comments'
        ]
        read_only_fields = ['id']

    def validate(self, attrs):
        request = self.context.get('request')
        if not request or not request.user or request.user.is_anonymous:
            raise serializers.ValidationError("Authenticated user is required.")

        try:
            profile = Profile.objects.get(id=attrs['profile_id'])
        except Profile.DoesNotExist:
            raise serializers.ValidationError({"profile_id": "Invalid profile."})

        if profile.user_id != request.user.id:
            raise serializers.ValidationError({"profile_id": "You can only add records to your own profile."})

        try:
            category = Category.objects.get(id=attrs['category_id'])
        except Category.DoesNotExist:
            raise serializers.ValidationError({"category_id": "Invalid category."})

        return attrs

    def create(self, validated_data):
        profile = Profile.objects.get(id=validated_data.pop('profile_id'))
        category = Category.objects.get(id=validated_data.pop('category_id'))

        return Expense.objects.create(
            profile=profile,
            category=category,
            **validated_data,
        )


class IncomeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = Income
        fields = ['id', 'user', 'profile', 'name', 'amount', 'timestamp', 'comments']
        read_only_fields = ['id', 'user', 'timestamp']


class CreateIncomeSerializer(serializers.ModelSerializer):
    profile_id = serializers.PrimaryKeyRelatedField(
        queryset=Profile.objects.all(),
        write_only=True
    )

    class Meta:
        model = Income
        fields = ['id', 'profile_id', 'name', 'amount', 'timestamp', 'comments']
        read_only_fields = ['id']

    def validate(self, attrs):
        request = self.context.get('request')
        if not request or not request.user or request.user.is_anonymous:
            raise serializers.ValidationError("Authenticated user is required.")

        profile = attrs.get('profile_id')
        if profile.user_id != request.user.id:
            raise serializers.ValidationError({
                "profile_id": "Profile must belong to your account."
            })

        # Validate amount is positive
        if attrs.get('amount', 0) <= 0:
            raise serializers.ValidationError({"amount": "Amount must be greater than zero."})

        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        profile = validated_data.pop('profile_id')
        return Income.objects.create(user=request.user, profile=profile, **validated_data)
    
class DebtSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Debt
        fields = ['id', 'user', 'name', 'amount', 'is_paid', 'due_date', 'timestamp', 'comments']
        read_only_fields = ['id', 'user', 'timestamp']


class CreateDebtSerializer(serializers.ModelSerializer):
    class Meta:
        model = Debt
        fields = ['id', 'name', 'amount', 'is_paid', 'due_date', 'timestamp', 'comments']
        read_only_fields = ['id']

    def validate(self, attrs):
        request = self.context.get('request')
        if not request or not request.user or request.user.is_anonymous:
            raise serializers.ValidationError("Authenticated user is required.")

        # Validate amount is positive
        if attrs.get('amount', 0) <= 0:
            raise serializers.ValidationError({"amount": "Amount must be greater than zero."})

        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        return Debt.objects.create(user=request.user, **validated_data)

