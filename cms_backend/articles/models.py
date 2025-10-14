from django.db import models
from django.contrib.auth.models import User  

class Article(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class AIUsage(models.Model):
    FEATURE_CHOICES = [
        ('generate', 'Content Generation'),
        ('summarize', 'Summarization'),
        ('seo', 'SEO Optimization'),
        ('tags', 'Tag Generation'),
        ('sentiment', 'Sentiment Analysis'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_usage')
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='ai_usage', null=True, blank=True)
    feature = models.CharField(max_length=50, choices=FEATURE_CHOICES)
    tokens_used = models.IntegerField(default=0)
    estimated_cost = models.DecimalField(max_digits=8, decimal_places=4)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.feature} - ${self.estimated_cost}"