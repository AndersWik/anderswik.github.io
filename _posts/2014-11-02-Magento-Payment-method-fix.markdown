---
layout: post
title:  "Magento payment method fix"
date:   2014-11-02 22:30:00
categories: Magento
---

When removing a payment method in Magento you can't open the old orders
that use the discarded payment method.

There is a "quick" fix for this. Before you try make a [backup][exportSQL] of the database.
Then change the `custom_payment` method to one of Magentos standard methods like `ccsave`.

If you set the new method to one you don't normaly use in the store you can easily find them later.

{% highlight sql %}

UPDATE`sales_flat_order_payment` SET `method`= 'ccsave'  WHERE `method` = 'custom_payment';

SELECT `parent_id`,`method` FROM `sales_flat_order_payment` WHERE `method` = 'custom_payment';

{% endhighlight %}



[exportSQL]:http://blog.anderswik.se/magento/2014/11/01/OSX-Export-Import-Sql-Database.html
