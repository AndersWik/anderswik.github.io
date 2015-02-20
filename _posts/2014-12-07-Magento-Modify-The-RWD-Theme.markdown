---
layout: post
title:  Magento Modify The RWD Theme
date:   2014-12-07 22:30:00
categories: Magento
---

Create a new folder with the name of your theme, `app/design/frontend/[ThemeName]`.

In your theme folder create a folder named `etc` with a file called `theme.xml`. The path would be `[ThemeName]/default/etc/theme.xml` In the file write the following.

{% highlight html %}
<?xml version="1.0"?>
<theme>
  <parent>rwd/default</parent>
</theme>
{% endhighlight %}

You are now extending the RWD theme. In the theme folder create a file called `local.xml`. The following structure should be used, `[ThemeName]/default/layout/local.xml`. In our `local.xml` we add the path too the themes custom css.

{% highlight html %}
<?xml version="1.0"?>
<layout>
  <default>
    <reference name="head">
      <action method="addItem">
        <type>skin_css</type>
        <name>css/[ThemeName].css</name>
        <params/><if><![CDATA[<!--[if (gte IE 9) | (IEMobile)]><!-->]]></if>
      </action>
    </reference>
  </default>
</layout>
{% endhighlight %}

Now with the path in place we go back to our root and in `skin/frontend/` we create the path `/[ThemeName]/default/css/[ThemeName].css`. If we have some JS files we can add it beneath the css in our `local.xml`. Then create a sibling directory to css called js. The full path is `/[ThemeName]/default/js/some.js`

{% highlight html %}
<action method="addItem">
  <type>skin_js</type>
  <name>js/some.js</name>
</action>
{% endhighlight %}

Next is the language translation. In you templates you will find echo `$this->__("text");`. This will look at the translation file in your theme. If your local is Swedish the path would be `[ThemeName]/default/locale/sv_SE/translate.csv`.

The last thing is to add the template path, `[ThemeName]/default/templates`.
