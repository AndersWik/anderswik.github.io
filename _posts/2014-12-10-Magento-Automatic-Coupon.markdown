---
layout: post
title:  Magento Automatic Coupons
date:   2014-12-10 22:30:00
categories: Magento
---

Get the count of the cart items every time the user add an item.

If you have a cart with six items, three with sku1 and three with sku2. The function `$cart->getSummaryCount()` returs 6 and the function `$cart->getItemsCount()` returns 2.

{% highlight php %}
<?php
class Demonfish_Coupons_Model_Observer
{
  protected function _getCart()
  {
    return Mage::getSingleton('checkout/cart');
  }

  public function setCouponCode($couponCode)
  {
    $cart = $this->_getCart();
    $cart->getQuote()->setCouponCode($couponCode)
    ->collectTotals()->save();
  }

  public function discount($observer = null)
  {
    $cart = Mage::helper('checkout/cart');
    $summary =  $cart->getSummaryCount();
    $items = $cart->getItemsCount();

    if($summary > 3 && $items > 3) {
      $this->setCouponCode('couponX2');
    } elseif($summary > 3) {
      $this->setCouponCode('couponX1');
    } elseif($items > 3) {
      $this->setCouponCode('couponX1');
    } else {
      $this->setCouponCode('');
    }
  }
}
?>
{% endhighlight %}


{% highlight html %}
<frontend>
  <events>
    <checkout_cart_save_after>
      <observers>
        <coupons>
          <class>coupons/observer</class>
          <method>discount</method>
        </coupons>
      </observers>
    </checkout_cart_save_after>
  </events>
</frontend>
{% endhighlight %}
