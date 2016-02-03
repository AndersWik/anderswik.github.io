---
layout: post
title:  Magento CMS Layout and syntax
date:   2015-12-21 22:30:00
categories: Magento
---

Using Magento template directives on CMS pages
-------------

### Skin

{% highlight html %}
{{skin url=’images/image.jpg’}}
{% endhighlight %}

### Media

{% highlight raw %}
{{media url="wysiwyg/image.jpg"}}
{% endhighlight %}

{% highlight php %}
<?php echo Mage::getBaseUrl('media').image.jpg;
{% endhighlight %}

### Htmlescape

{% highlight html %}

{% endhighlight %}

### Store

{% highlight html %}

{% endhighlight %}

### Block

{% highlight html %}
{{block type="cms/block" block_id="your_block_id"}}
{% endhighlight %}

### Layout

{% highlight html %}

{% endhighlight %}

### Config

{% highlight html %}

{% endhighlight %}

### Customvar

{% highlight html %}

{% endhighlight %}

### Protocol

{% highlight html %}

{% endhighlight %}

### Widget

{% highlight html %}

{% endhighlight %}
