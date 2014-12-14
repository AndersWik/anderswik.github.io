---
layout: post
title:  Magento Kelkoo Tracking
date:   2014-12-02 22:30:00
categories: Magento
---


On the [Kelkoo][support-kelkoo] support site we can find a php example.
In magento we need to add some additional data. Create a file called `success.phtml`. Modify the following code and add it to the `success.phtml` file.

{% highlight php %}
<?php
/*Kelkoo Tracking*/
$order = Mage::getModel("sales/order")->getCollection()->getLastItem();
$orderNumber = $order->getIncrementId();
$orderValue = $order->getGrandTotal();
$org_id = 00000;
$event = 000000;
$currency = "SEK";
echo "<img src=\"http://tbs.tradedoubler.com/report?organization=".$org_id."&event=".$event."&orderNumber=".$orderNumber."&orderValue=".$orderValue."&currency=".$currency."\" />";
?>
{% endhighlight %}

Then add this to the success page.

{% highlight html %}
<cart_index_success>
<reference name="cart.success">
<action method="setTemplate"><value>cart/success.phtml</value></action>
</reference>
</cart_index_success>
{% endhighlight %}



[support-kelkoo]: http://support.kelkoo.com/scan/pages.php?page=3110&menu=402
