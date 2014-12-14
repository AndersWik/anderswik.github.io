---
layout: post
title:  Magento Target Product Types
date:   2014-12-03 22:30:00
categories: Magento
---


Using the `local.xml` file to target a type of products.

{% highlight html %}
<?xml version="1.0"?>
<layout>

<PRODUCT_TYPE_bundle translate="label" module="bundle">
<remove name="footer" />
</PRODUCT_TYPE_bundle>

</layout>
{% endhighlight %}

Use the following different types of products.

<ul>
<li>PRODUCT_TYPE_simple</li>
<li>PRODUCT_TYPE_configurable</li>
<li>PRODUCT_TYPE_grouped</li>
<li>PRODUCT_TYPE_virtual</li>
</ul>
