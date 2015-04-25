---
layout: post
title:  Simple Magento Newsletter signup-popup
date:   2015-02-16 22:30:00
updated:   2015-04-25 22:30:00
categories: Magento
---
Create a new CMS page with the following setup.

Titel: `Newsletter`

Url Key: `newsletter`

In the content tab write:
{% highlight html %}
{% raw %}
{{block type="newsletter/subscribe" template="newsletter/subscribe.phtml"}}
<a href="javascript:window.close();">Close</a>
{% endraw %}
{% endhighlight %}


Design:

{% highlight html %}
<remove name="left"/>
<remove name="righ"/>
<remove name="header"/>
<remove name="footer"/>
<remove name=“breadcrumbs”/>
{% endhighlight %}

To open the window use,

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

Or simply type:
{% highlight bash %}
<a class="newsletter" onclick="window.open('/newsletter','','width=460,height=290');">Newsletter</a>
{% endhighlight %}
