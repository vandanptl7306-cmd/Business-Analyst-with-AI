from django.db import models
from django.core.validators import RegexValidator

class Party(models.Model):
    name = models.CharField(max_length=255)
    
    phone_regex = RegexValidator(
        regex=r'^\+[1-9]\d{1,14}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    phone_number = models.CharField(validators=[phone_regex], max_length=17)
    
    whatsapp_enabled = models.BooleanField(default=True)
    outstanding_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    tally_guid = models.CharField(max_length=100, blank=True, null=True, unique=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
