---
layout: post
title:  Add customer email to Magento invoices
date:   2015-05-13 22:30:00
categories: Magento
---

Add customer email either to email or pdf invoices in Magento.


Add customer email to Magento email invoices
-------------
You find the invoice email templates in `app > locale > {Country_Code} > template > email > sales`. For loged in users the template file is `invoice_new.html`. To insert the email use,

{% highlight php %}
{% raw %}
{{var order.getCustomerEmail()}}
{% endraw %}
{% endhighlight %}

For guest users the template file is `invoice_new_guest.html`. To insert the email use,

{% highlight php %}
{% raw %}
{{var order.getBillingAddress().getEmail()}}
{% endraw %}
{% endhighlight %}


Add customer email to Magento pdf invoices
-------------

If we want to add the customer email to the pdf invoices copy `Core/Mage/Sales/Model/Order/Pdf/Abstract.php` to `Local/Mage/Sales/Model/Order/Pdf/Abstract.php`. In the new file find the following function at row 269.

{% highlight php %}
<?php
protected function insertOrder(&$page, $obj, $putOrderId = true)
{ ... }
{% endhighlight %}

On line 351 you find the following row `$page->drawRectangle(25, ($top - 25), 570, $top - 33 - $addressesHeight )`. Add - 15 after the addresses height variable. The -15 makes room for the email row. When you are done it should look like,

{% highlight php %}
<?php
$page->drawRectangle(25, ($top - 25), 570, $top - 33 - $addressesHeight - 15)
{% endhighlight %}

Next we look at the `foreach ($billingAddress as $value){...}`. This prints the address information to the invoice. It should be at row 372. In it we find to additional for-loops. In the second one the address rows are printed.

{% highlight php %}
<?php
foreach ($text as $part) {
  $page->drawText(strip_tags(ltrim($part)), 35, $this->y, 'UTF-8');
  $this->y -= 15;
}
{% endhighlight %}

Copy the two rows inside the second forloop.

{% highlight php %}
<?php
$page->drawText(strip_tags(ltrim($part)), 35, $this->y, 'UTF-8');
$this->y -= 15
{% endhighlight %}

Then paste the rows on line 373 after the first `foreach`. Replace `strip_tags(ltrim($part))` with `Mage::helper("sales")->__('E: '. $order->getCustomerEmail())`. It should look like,


{% highlight php %}
<?php
foreach ($shippingAddress as $value){
  if ($value!=='') {
    $text = array();
    foreach (Mage::helper('core/string')->str_split($value, 45, true, true) as $_value) {
      $text[] = $_value;
    }
    foreach ($text as $part) {
      $page->drawText(strip_tags(ltrim($part)), 285, $this->y, 'UTF-8');
      $this->y -= 15;
    }
  }
}
$page->drawText(Mage::helper("sales")->__('E: '. $order->getCustomerEmail()), 35, $this->y, 'UTF-8');
$this->y -= 15;
{% endhighlight %}

Now you have an additional row with the customer email on the pdf invoice.
