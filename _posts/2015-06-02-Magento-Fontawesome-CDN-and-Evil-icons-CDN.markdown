---
layout: post
title:  Fontawesome, Evil-icons and Google Fonts for Magento
date:   2015-06-02 22:30:00
updated:   2015-07-24 22:30:00
categories: Magento
---

When doing your project you probably want to use fonts that are free, open and awesome.


Fontawesome CDN
-------------

{% highlight xml %}
<reference name="head">
  <block type="core/text" name="fontawesome.cdn">
    <action method="setText">
      <text><![CDATA[<link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css">
      ]]></text>
    </action>
  </block>
</reference>
{% endhighlight %}

Or we can use,

{% highlight xml %}
<reference name="head">
  <action method="addLinkRel">
    <rel>stylesheet</rel>
    <href>http://maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css</href>
  </action>
</reference>
{% endhighlight %}

Or in the css file,

{% highlight xml %}
@import url(http://maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css);
{% endhighlight %}

[http://fortawesome.github.io/Font-Awesome/][fontawesome]

Evil-icons CDN
-------------

{% highlight xml %}
<reference name="head">
  <block type="core/text" name="evil-icons.cdn">
    <action method="setText">
      <text><![CDATA[<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/evil-icons/1.7.2/evil-icons.min.css">
      <script src="//cdnjs.cloudflare.com/ajax/libs/evil-icons/1.7.2/evil-icons.min.js"></script>]]></text>
    </action>
  </block>
</reference>
{% endhighlight %}

[http://evil-icons.io][evil-icons]


Google Fonts CDN
-------------

{% highlight xml %}
<reference name="head">
  <block type="core/text" name="google-fonts">
      <action method="setText">
        <text><![CDATA[<link rel="stylesheet" type="text/css" href="http://fonts.googleapis.com/css?family=Roboto">]]></text>
      </action>
  </block>
</reference>
{% endhighlight %}

Or we can use,

{% highlight xml %}
<reference name="head">
  <action method="addLinkRel">
    <rel>stylesheet</rel>
    <href>http://fonts.googleapis.com/css?family=Open+Sans+Condensed:300</href>
  </action>
</reference>
{% endhighlight %}

Or in the css file,

{% highlight xml %}
@import url(http://fonts.googleapis.com/css?family=Open+Sans+Condensed:300)
{% endhighlight %}

[https://www.google.com/fonts][google-fonts]



Bonus: Viewport
-------------

{% highlight xml %}
<reference name="head">
  <block type="core/text" name="viewport">
    <action method="setText">
      <text><![CDATA[<meta name="viewport" content="width=device-width, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no"/>]]></text>
    </action>
  </block>
</reference>
{% endhighlight %}








[fontawesome]:http://fortawesome.github.io/Font-Awesome/
[evil-icons]:http://evil-icons.io
[google-fonts]:https://www.google.com/fonts
