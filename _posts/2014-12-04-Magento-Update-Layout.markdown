---
layout: post
title:  Magento Update Layout
date:   2014-12-04 22:30:00
categories: Magento
---


Using the `local.xml` file to change the layout.

{% highlight html %}
  <catalog_category_default>
    <reference name="root">
      <action method="setTemplate">
      <template>page/2columns-right.phtml</template>
    </action>
  </reference>
</catalog_category_default>
{% endhighlight %}

Or update more than one page at the time with a update handle.

{% highlight html %}
  <set_2col_right>
    <reference name="root">
      <action method="setTemplate">
        <template>page/2columns-right.phtml</template>
      </action>
    </reference>
  </set_2col_right>

  <catalog_category_default>
    <update handle="set_2col_right"/>
  </catalog_category_default>

  <customer_account_index>
    <update handle="set_2col_right"/>
  </customer_account_index>
{% endhighlight %}
