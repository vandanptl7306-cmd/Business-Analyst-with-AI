from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True)
    mrp = models.DecimalField(max_digits=12, decimal_places=2)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    average_cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    TAX_CHOICES = (
        (0, '0%'),
        (5, '5%'),
        (12, '12%'),
        (18, '18%'),
        (28, '28%'),
    )
    tax_rate = models.IntegerField(choices=TAX_CHOICES, default=18)
    is_tax_inclusive = models.BooleanField(default=True)
    tally_guid = models.CharField(max_length=100, blank=True, null=True, unique=True)

    barcode = models.CharField(max_length=255, blank=True, null=True)
    minimum_order_quantity = models.IntegerField(default=1)
    batch_number = models.CharField(max_length=100, blank=True, null=True)
    bill_of_materials_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    quantity = models.IntegerField(default=0)
    expiry_date = models.DateField(blank=True, null=True)
    low_stock_threshold = models.IntegerField(default=5)
    unit = models.CharField(max_length=50, blank=True, null=True, default='pcs')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.sku})"

class RawMaterial(models.Model):
    product = models.ForeignKey(Product, related_name='raw_materials', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    quantity_needed = models.DecimalField(max_digits=10, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.name} for {self.product.name}"
