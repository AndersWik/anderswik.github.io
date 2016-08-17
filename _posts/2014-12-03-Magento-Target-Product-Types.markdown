---
layout: post
title:  Magento Target Product Types
date:   2014-12-03 22:30:00
updated: 2016-08-16 22:30:00
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

* PRODUCT_TYPE_simple
* PRODUCT_TYPE_configurable
* PRODUCT_TYPE_grouped
* PRODUCT_TYPE_virtual
* PRODUCT_TYPE_downloadable
* PRODUCT_TYPE_bundle
