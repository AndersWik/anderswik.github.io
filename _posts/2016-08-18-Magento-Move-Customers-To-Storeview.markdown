---
layout: post
title:  Move Customers To Another Storeview
date:   2016-08-11 22:30:00
categories: Magento
---

It is easy to move all customers from one website to another. All data about what website and storeview the customers connected to are in the `customer_entity` table. Let's say that we have a structure like below.

* [website1]
	* [storeview1]
	* [storeview2]

If we want to move the customers from storeview1 to storeview2 we can use the following query.

<div class="alert alert-danger" role="alert">
  <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
  Try on a development site first!
</div>

{% highlight sql %}
UPDATE `customer_entity` SET store_id="2" WHERE store_id="1"
{% endhighlight %}

If we have moved a storeview from one website to another the query is almost the same. If we started with a structure like the one above but now it looks like below.

* [website1]
	* [storeview1]
* [website2]
	* [storeview2]

In the query we still need to search for the store id. But we do not change it since we moved the store view and it is already correct. It is the website id that is wrong.

{% highlight sql %}
UPDATE `customer_entity` SET website_id="2" WHERE store_id="2"
{% endhighlight %}

If we want to move all customers from one storeview to another storeview and the second storeview are in a different website. We must change both the storeview id and website id.

* [website1]
	* [storeview1]
	* [storeview2]
* [website2]
	* [storeview3]
	* [storeview4]

If we have the structure like above and want to move the customers frome storeview 1 to storeview 3 we can use the following query.

{% highlight sql %}
UPDATE `customer_entity` SET website_id="2", store_id="3" WHERE store_id="1"
{% endhighlight %}

We can also move all customers that are in one customergroup to another storeview.

{% highlight sql %}
UPDATE `customer_entity` SET website_id="7", store_id="7" WHERE group_id="11"
{% endhighlight %}
