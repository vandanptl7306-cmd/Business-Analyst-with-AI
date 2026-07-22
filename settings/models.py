from django.db import models

class StoreSettings(models.Model):
    shop_name = models.CharField(max_length=255, default='Business Analyst with AI Operations')
    address = models.TextField(default='101, Business Enclave, Cyber City, Sector 45, Gurgaon, Haryana')
    phone_number = models.CharField(max_length=20, default='+919876543210')
    email = models.EmailField(default='billing@business-analyst.ai')
    gstin = models.CharField(max_length=15, default='27AAAAA1111A1Z1')
    logo_url = models.URLField(blank=True, null=True)
    
    DEFAULT_INVOICE_TEMPLATE_CHOICES = (
        ('Standard', 'Standard'), ('Modern', 'Modern'), ('Thermal', 'Thermal'),
        ('TaxInvoice', 'TaxInvoice'), ('Minimalist', 'Minimalist'),
        ('Commercial', 'Commercial'), ('Proforma', 'Proforma')
    )
    default_invoice_template = models.CharField(max_length=50, choices=DEFAULT_INVOICE_TEMPLATE_CHOICES, default='Standard')
    invoice_theme_color = models.CharField(max_length=20, default='#2563eb')
    
    BUSINESS_TYPE_CHOICES = (('Retail', 'Retail'), ('Wholesale', 'Wholesale'), ('Manufacturing', 'Manufacturing'))
    business_type = models.CharField(max_length=50, choices=BUSINESS_TYPE_CHOICES, default='Retail')
    
    PRINTER_TYPE_CHOICES = (('Regular', 'Regular'), ('Thermal', 'Thermal'))
    printer_type = models.CharField(max_length=50, choices=PRINTER_TYPE_CHOICES, default='Regular')

    regular_layout_theme = models.CharField(max_length=50, default='Standard')
    regular_theme_color = models.CharField(max_length=20, default='#2563eb')
    print_repeat_header = models.BooleanField(default=False)
    
    print_company_name = models.BooleanField(default=True)
    custom_company_name = models.CharField(max_length=255, blank=True, null=True)
    print_company_logo = models.BooleanField(default=True)
    custom_logo_url = models.URLField(blank=True, null=True)
    print_address = models.BooleanField(default=True)
    custom_address = models.TextField(blank=True, null=True)
    print_email = models.BooleanField(default=True)
    custom_email = models.EmailField(blank=True, null=True)
    print_phone = models.BooleanField(default=True)
    custom_phone = models.CharField(max_length=20, blank=True, null=True)
    print_gstin = models.BooleanField(default=True)
    custom_gstin = models.CharField(max_length=15, blank=True, null=True)
    auto_send_whatsapp = models.BooleanField(default=False)

    paper_size = models.CharField(max_length=20, default='A4')
    orientation = models.CharField(max_length=20, default='Portrait')
    company_name_text_size = models.CharField(max_length=20, default='Large')
    invoice_text_size = models.CharField(max_length=20, default='Large')

    print_total_qty = models.BooleanField(default=True)
    amount_with_decimal = models.BooleanField(default=True)
    print_received_amount = models.BooleanField(default=True)
    print_balance_amount = models.BooleanField(default=False)
    print_current_balance = models.BooleanField(default=False)
    print_tax_details = models.BooleanField(default=True)
    print_you_saved = models.BooleanField(default=False)
    print_amount_with_grouping = models.BooleanField(default=True)
    amount_in_words_format = models.CharField(max_length=50, default='Indian')

    company_tagline = models.CharField(max_length=255, blank=True, null=True)
    po_reference = models.CharField(max_length=100, blank=True, null=True)
    invoice_notes = models.TextField(blank=True, null=True)

    print_bank_details = models.BooleanField(default=False)
    bank_account_holder_name = models.CharField(max_length=255, blank=True, null=True)
    bank_name = models.CharField(max_length=255, blank=True, null=True)
    bank_account_number = models.CharField(max_length=50, blank=True, null=True)
    bank_ifsc_code = models.CharField(max_length=20, blank=True, null=True)
    bank_branch_name = models.CharField(max_length=255, blank=True, null=True)

    print_description = models.BooleanField(default=True)

    thermal_printing_type = models.CharField(max_length=50, default='Text Printing')
    thermal_use_text_styling_bold = models.BooleanField(default=True)
    thermal_auto_cut = models.BooleanField(default=True)
    thermal_open_cash_drawer = models.BooleanField(default=True)
    thermal_extra_lines = models.IntegerField(default=0)
    thermal_copies = models.IntegerField(default=1)
    thermal_print_company_name = models.BooleanField(default=True)
    thermal_company_name = models.CharField(max_length=255, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Store Settings for {self.shop_name}"
