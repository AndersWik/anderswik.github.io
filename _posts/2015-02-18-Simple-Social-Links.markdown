---
layout: post
title:  Simple Social Links
date:   2015-02-18 22:30:00
categories: Javascript
---

Simple links to share on social-sites. Popup or none popup.

<!-- Facebook -->

<a href="http://www.facebook.com/sharer.php?u=ttp://blog.anderswik.se" target="_blank">Share on Facebook 1</a>

{% highlight bash %}
<a href="http://www.facebook.com/sharer.php?u=ttp://blog.anderswik.se" target="_blank">Share on Facebook 1</a>
{% endhighlight %}

<a href="https://sv-se.facebook.com/sharer/sharer.php?u=http://blog.anderswik.se" target="_blank">Share on Facebook 2</a>

{% highlight bash %}
<a href="https://sv-se.facebook.com/sharer/sharer.php?u=http://blog.anderswik.se" target="_blank">Share on Facebook 2</a>
{% endhighlight %}

<!-- Twitter -->

<a href="http://twitter.com/share?url=http://blog.anderswik.se&text=Some Text&hashtags=sharelink" target="_blank">Share on Twitter 1</a>

{% highlight bash %}
<a href="http://twitter.com/share?url=http://blog.anderswik.se&text=Some Text&hashtags=sharelink" target="_blank">Share on Twitter 1</a>
{% endhighlight %}


<a href="https://twitter.com/home/?status=blog (http://blog.anderswik.se)" target="_blank">Share on Twitter 2</a>

{% highlight bash %}
<a href="https://twitter.com/home/?status=blog (http://blog.anderswik.se)" target="_blank">Share on Twitter 2</a>
{% endhighlight %}

<!-- Google+ -->

<a href="https://plus.google.com/share?url=http://blog.anderswik.se" target="_blank">Share on Google+</a>

{% highlight bash %}
<a href="https://plus.google.com/share?url=http://blog.anderswik.se" target="_blank">Share on Google+</a>
{% endhighlight %}

<!-- Digg -->

<a href="http://www.digg.com/submit?url=http://blog.anderswik.se" target="_blank">Share on Digg</a>

{% highlight bash %}
<a href="http://www.digg.com/submit?url=http://blog.anderswik.se" target="_blank">Share on Digg</a>
{% endhighlight %}

<!-- Reddit -->

<a href="http://reddit.com/submit?url=http://blog.anderswik.se&title=Share Links" target="_blank">Share on Reddit</a>

{% highlight bash %}
<a href="http://reddit.com/submit?url=http://blog.anderswik.se&title=Share Links" target="_blank">Share on Reddit</a>
{% endhighlight %}

<!-- LinkedIn -->

<a href="http://www.linkedin.com/shareArticle?mini=true&url=http://blog.anderswik.se" target="_blank">Share on LinkedIn</a>

{% highlight bash %}
<a href="http://www.linkedin.com/shareArticle?mini=true&url=http://blog.anderswik.se" target="_blank">Share on LinkedIn</a>
{% endhighlight %}

<!-- StumbleUpon-->
<a href="http://www.stumbleupon.com/submit?url=http://blog.anderswik.se&title=Simple Share Buttons" target="_blank">StumbleUpon</a>

{% highlight bash %}
<a href="http://www.stumbleupon.com/submit?url=http://blog.anderswik.se&title=Simple Share Buttons" target="_blank">StumbleUpon</a>
{% endhighlight %}

<!-- Pinterest-->
<a href="https://pinterest.com/pin/create/button/?url=http://blog.anderswik.se&media=some&description=some-description" target="_blank">StumbleUpon</a>

{% highlight bash %}
<a href="https://pinterest.com/pin/create/button/?url=http://blog.anderswik.se&media=some&description=some-description" target="_blank">StumbleUpon</a>
{% endhighlight %}



<script language="javascript" type="text/javascript">
<!--
function popWin(url, name) {
  popwin=window.open(url,name,'height=250,width=350');
  if (window.focus) {popwin.focus()}
  return false;
}
// -->
</script>

<a href="javascript:popWin('http://blog.anderswik.se','share');" title="Share!">Share Popup</a>


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

<a href="javascript:popWin('http://blog.anderswik.se','share');" title="Share!">Share Popup</a>
{% endhighlight %}

To use the a share link in the pop up use the ful share url.

{% highlight bash %}
<a href="javascript:popWin('http://twitter.com/share?url=http://blog.anderswik.se&text=Some','share');" title="Share!">Share on Twitter</a>
{% endhighlight %}



[x]:http://inchoo.net/ecommerce/simple-social-sharing-buttons-in-magento/
