---
layout: post
title:  Magento Remove Toolbar from Product List
date:   2014-12-01 22:30:00
categories: Magento
---

If we have a product list and we want to remove the toolbar we can do this in
a couple of different ways.


If we look at the product list file in the rwd theme.

`app/design/frontend/rwd/default/template/catalog/product/list.phtml`

On line 43 and 173 we find.

{% highlight php %}
<?php echo $this->getToolbarHtml() ?>
{% endhighlight %}

This is were we print the toolbar. To remove it copy the file to your
custom theme.

`app/design/frontend/[YOUR THEME NAME]/default/template/catalog/product/list.phtml`

In the new file you can remove line 43 and 173. The problem with this is that you do not have a toolbar at any of the pages. To fix this replace `<?php echo $this->getToolbarHtml() ?>` with,

{% highlight php %}
<?php if (!$this->getHideToolbar()): ?>
<?php echo $this->getToolbarHtml() ?>
<?php endif ?>
{% endhighlight %}

Now you can use `<action method="setHideToolbar"><value>true</value></action>` too turn the toolbar on and off on different pages using the local.xml.

Example, to turn off the toolbar on the CMS index page and keep it on all other pages type the following in the local.xml file.

{% highlight html %}
  <cms_index_index>
    <reference name="content">
      <block type="catalog/product_list" name="featured" template="catalog/product/list.phtml">
        <block type="core/text_list" name="product_list.name.after" as="name.after" />
        <block type="core/text_list" name="product_list.after" as="after" />

        <action method="setCategoryId"><category_id>14</category_id></action>
        <action method="setTitle" translate="value"><value>Featured Products</value></action>
        <action method="setColumnCount"><columns>5</columns></action>
        <action method="setMode"><value>grid</value></action>
        <action method="setForceGrid"><value>true</value></action>
        <action method="setLimit"><value>4</value></action>
        <action method="setHideToolbar"><value>1</value></action>

      </block>
    </reference>
  </cms_index_index>

{% endhighlight %}
