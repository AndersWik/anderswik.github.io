---
layout: post
title:  "Magento XML Quick Tip"
date:   2014-10-19 22:30:00
categories: Magento
---

How do I know Magento can see my layout XML?

{% highlight html %}
<?xml version="1.0" encoding="UTF-8"?>
<layout>
  <remove name="header"></remove>
  <remove name="footer"></remove>
</layout>
{% endhighlight %}

Add the above header and footer tags to the XML file between the layout tags.
If Magento can see the XML file both the header and footer will be removed.
