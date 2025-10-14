from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Article , AIUsage

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class ArticleSerializer(serializers.ModelSerializer):
   
    author = serializers.StringRelatedField(read_only=True)  

    class Meta:
        model = Article
        fields = ['id', 'title', 'content', 'author', 'created_at', 'updated_at']


class AIUsageSerializer(serializers.ModelSerializer):
    article_title = serializers.CharField(source='article.title', read_only=True)

    class Meta:
        model = AIUsage
        fields = ['id', 'article_title', 'feature', 'tokens_used', 'estimated_cost', 'created_at']