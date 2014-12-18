---
layout: post
title:  Magento Facebook Conversion Pixels
date:   2014-12-06 22:30:00
categories: Magento
---

Add a Facebook conversion pixel to your Magento site.
Don't know what a [Facebook Conversion Pixel][facebook-conversion] is? There is a [video][facebook-conversion]!

When you have the script create a new phtml and name it `facebookconversion.phtml`. Add the script
you got from Facebook. It should look something like this.

{% highlight js %}
<script>(function() {
  var _fbq = window._fbq || (window._fbq = []);

  if (!_fbq.loaded) {
    var fbds = document.createElement('script');
    fbds.async = true;
    fbds.src = '//http://connect.facebook.net/en_US/fbds.js';;
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(fbds, s);
    _fbq.loaded = true;
  }
  })();

  window._fbq = window._fbq || [];
  window._fbq.push(['track', '0000000000000', {'value':value,'currency':'SEK'}]);
</script>

<noscript><img height="1" width="1" alt="" style="display:none" src="https://www.facebook.com/tr?ev=0000000000000&cd[value]=0.01&cd[currency]=SEK&noscript=1 (https://www.facebook.com/tr?ev=0000000000000&cd%5bvalue%5d=0.01&cd%5bcurrency%5d=SEK&noscript=1)" /></noscript>
{% endhighlight %}

Above your script in the `facebookconversion.phtml` add the following code.

{% highlight php %}
<?php
  $order = Mage::getModel("sales/order")->getCollection()->getLastItem();
  $orderValue = $order->getGrandTotal();
  echo '<script> var value = '.$orderValue.' </script>';
?>
{% endhighlight %}

Add the page to your carts checkout success page with your `local.xml`.

{% highlight html %}
<cart_index_success>
  <reference name='head'>
    <block type='core/template' template='page/facebookconversion.phtml' after="-" />
  </reference>
</cart_index_success>
{% endhighlight %}

You are done.

[facebook-conversion]:https://www.facebook.com/help/435189689870514/
