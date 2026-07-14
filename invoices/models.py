from django.db import models

class Invoice(models.Model):
    invoice_number = models.CharField(max_length=50, unique=True)
    invoice_date = models.DateTimeField(auto_now_add=True)
    recorded_at = models.DateTimeField(auto_now_add=True)
    
    seller_name = models.CharField(max_length=255)
    seller_gstin = models.CharField(max_length=50)
    seller_pin = models.CharField(max_length=20)
    
    buyer_name = models.CharField(max_length=255)
    buyer_gstin = models.CharField(max_length=50)
    buyer_billing_address = models.TextField()
    buyer_pin = models.CharField(max_length=20)
    
    sub_total = models.DecimalField(max_digits=12, decimal_places=2)
    tax_total = models.DecimalField(max_digits=12, decimal_places=2)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2)
    
    STATUS_CHOICES = (
        ('Draft', 'Draft'), ('Unpaid', 'Unpaid'),
        ('Partially Paid', 'Partially Paid'), ('Paid', 'Paid'),
        ('Cancelled', 'Cancelled')
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Draft')
    
    irn = models.CharField(max_length=100, blank=True, null=True)
    qr_code_data = models.TextField(blank=True, null=True)
    e_invoice_status = models.CharField(max_length=20, default='NotGenerated')
    e_invoice_generated_at = models.DateTimeField(blank=True, null=True)
    
    e_way_bill_no = models.CharField(max_length=50, blank=True, null=True)
    transporter_id = models.CharField(max_length=50, blank=True, null=True)
    transporter_name = models.CharField(max_length=255, blank=True, null=True)
    transport_mode = models.CharField(max_length=20, blank=True, null=True)
    vehicle_no = models.CharField(max_length=20, blank=True, null=True)
    vehicle_type = models.CharField(max_length=20, blank=True, null=True)
    distance = models.IntegerField(blank=True, null=True)
    e_way_bill_status = models.CharField(max_length=20, default='NotGenerated')
    e_way_bill_generated_at = models.DateTimeField(blank=True, null=True)
    
    whatsapp_sent_status = models.CharField(max_length=20, default='NotSent')
    last_reminder_sent_at = models.DateTimeField(blank=True, null=True)
    
    bill_type = models.CharField(max_length=20, default='Invoice')
    template_type = models.CharField(max_length=50, default='Standard')
    invoice_theme_color = models.CharField(max_length=20, default='#2563eb')
    
    store_snapshot = models.JSONField(blank=True, null=True)
    
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    net_profit = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    profit_margin_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    
    tally_guid = models.CharField(max_length=100, blank=True, null=True, unique=True)
    is_synced_to_tally = models.BooleanField(default=False)
    tally_sync_date = models.DateTimeField(blank=True, null=True)
    
    compliance_audit_status = models.CharField(max_length=20, default='Pending')
    compliance_flags = models.JSONField(default=list)
    compliance_confidence_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Invoice {self.invoice_number}"

class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, related_name='items', on_delete=models.CASCADE)
    description = models.CharField(max_length=255)
    hsn_code = models.CharField(max_length=50)
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=12, decimal_places=2)
    gst_rate = models.IntegerField()
    cgst = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    sgst = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    igst = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    mrp = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    is_tax_inclusive = models.BooleanField(default=True)
    base_price = models.DecimalField(max_digits=12, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    unit_cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.description} (x{self.quantity}) on {self.invoice.invoice_number}"
