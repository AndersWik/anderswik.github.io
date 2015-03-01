---
layout: post
title:  Add JQuery to Magento.
date:   2015-02-27 22:30:00
categories: Magento
---
If you want to add [JQuery][jquery.com] to your Magento installation there are two fast ways. The first is to add it to your theme with `local.xml`. The second way is to make a [module][jquery] that adds it to Magento.

To add it to the theme, start with downloading [JQuery][jquery.com/download]. Then put the file in the base default theme. If you download `jquery-2.1.3.min` the full path should be `skin/frontend/base/default/jquery/jquery-2.1.3.min.js`. Next create another script `noconflict.js` and put the following content in it.

{% highlight bash %}
$.noConflict();
{% endhighlight %}

The full path should be `skin/frontend/base/default/jquery/noconflict.js`. The next step is to add a `local.xml` file. The file should be located in `app/design/frontend/base/default/layout`. In the file add the two scripts.

{% highlight bash %}
<?xml version="1.0"?>
<layout version="0.1.0">
  <default translate="label">
    <reference name="head">
      <action method="addItem">
        <type>skin_js</type>
        <name>jquery/jquery-2.1.3.min.js</name>
      </action>
      <action method="addItem">
        <type>skin_js</type>
        <name>jquery/noconflict.js</name>
      </action>
    </reference>
  </default>
</layout>
{% endhighlight %}

[JQuery][jquery.com] is now added. To test if [JQuery][jquery.com] works you can use the following script. Note that you need to use the full `JQuery` and not `$` in your document ready function.

{% highlight bash %}
<script>
jQuery( document ).ready(function( $ ) {
  $("#header").mouseenter(function(){
      alert("You entered header!");
  });
});
</script>
{% endhighlight %}


The module does the same thing. [Download][jquery] the finished module from git.


[jquery]:https://github.com/AndersWik/Magento_Wik_Jquery
[jquery.com]:http://jquery.com/
[jquery.com/download]:http://jquery.com/download/
