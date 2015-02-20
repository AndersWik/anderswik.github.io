---
layout: post
title:  Simple Magento Newsletter signup-popup
date:   2015-02-16 22:30:00
categories: Magento
---
Create a new CMS page with the following setup.

Titel: Newsletter

Url Key: newsletter

{% raw %}
Content: {{block type="newsletter/subscribe" template="newsletter/subscribe.phtml"}}
{% endraw %}

Design:

{% highlight html %}
<remove name="left"/>
<remove name="righ"/>
<remove name="header"/>
<remove name="footer"/>
<remove name=“breadcrumbs”/>
{% endhighlight %}


{% highlight bash %}
<script language="javascript" type="text/javascript">
<!--
function popWin(url, name) {
  popwin=window.open(url,name,'height=250,width=350');
  if (window.focus) {popwin.focus()}
  return false;
}
// -->
</script>

<a href="javascript:popWin('http://yourstore/newsletter','newsletter');" title="Sign up">Sign up!</a>
{% endhighlight %}
