---
layout: post
title:  Magento Layout XML
date:   2014-12-04 22:30:00
updated:   2016-04-21 22:30:00
categories: Magento
---

Uncompleted notes about `layout.xml`. We can add layout changes in three different ways. Admin, module and theme.

Layout XML with modules
-------------

If we want to add layout changes with a module we need to add this in the modules `config.xml`. We add the layout update tags in the frontend section of the xml.

{% highlight html %}
<?xml version="1.0"?>
<config>
    <modules>
        <Your_Module>
            <version>1.0.0.0</version>
        </Your_Module>
    </modules>
    <frontend>
      <layout>
        <updates>
          <module>
            <file>module.xml</file>
          </module>
        </updates>
      </layout>
    </frontend>
</config>
{% endhighlight %}

In the file tag we define the name of the xml file we are going to make the layout changes in. The path to our file will be `app > design > frontend > base > default > layout > module.xml`

We always add our modules layout xml file to the `base > default` theme.
This because `base > default` is the last theme in the fallback hierarchy.
This makes sure that Magento can see the file whatever theme the store might be using.

Layout XML with Local.xml
-------------

If we want to add layout changes to a theme but not make a module we can also use the `local.xml` file. You can add a `local.xml` file to any theme in Magento (`app > design > frontend > [Pakage] > [Theme] > layout > local.xml`). Magento reads the XML layout files in a specific order. The a `local.xml` file will always be added last. This allows you to overwrite all other layout xml updates in a single file.


How to use Layout XML
-------------

If we want to make changes to a theme we need to use handles. A handle defines what pages the changes will be made to. The `<default>` handle are used for making changes on (almost) all pages. To remove the `head` block from all pages we can type.

{% highlight html %}
<?xml version="1.0"?>
<layout version="0.1.0">
  <default>
    <remove name="head" />
  </default>
</layout>
{% endhighlight %}


If we want to make changes to a specific page we need that pages handle.
A handle are `[module_front_name]_[controller_name]_[action_name]`. An example is the index page. If we want to find out the handle for the CMS index page we go to `app > code > core > Mage > CMS > etc > config.xml`. Here we find the front name of the module.

{% highlight html %}
<frontend>
  <routers>
    <cms>
      <use>standard</use>
      <args>
        <module>Mage_Cms</module>
        <frontName>cms</frontName>
      </args>
    </cms>
  </routers>
<frontend>
{% endhighlight %}

We were looking for the CMS index page and this is the IndexController and the IndexAction. The controller name in the handle is the controller name minus `Controller`. This gives us `index`. The action name in the handle is the action name minus `Action`. This again gives us `index`. We now have the full handle `cms_index_index`. Now we can remove the `head` block on only the cms index page and keep it on all other pages.

{% highlight html %}
<?xml version="1.0"?>
<layout version="0.1.0">
  <cms_index_index>
    <remove name="head" />
  </cms_index_index>
</layout>
{% endhighlight %}

Some additional good to know handles. We can target product types.

{% highlight xml %}
<PRODUCT_TYPE_simple>
<PRODUCT_TYPE_configurable>
<PRODUCT_TYPE_grouped>
<PRODUCT_TYPE_virtual>
<PRODUCT_TYPE_downloadable>
<PRODUCT_TYPE_bundle>
{% endhighlight %}

We can also target a specific store. The syntax is `STORE_` followed by
the store code. If we have one storeview with the store code `en` and one with the store code `sv` the syntax would be,

{% highlight xml %}
<?xml version="1.0"?>
<layout version="0.1.0">
  <STORE_en>
    <remove name="head" />
  </STORE_en>
  <STORE_sv>
    <remove name="head" />
  </STORE_sv>
</layout>
{% endhighlight %}

### References

In layout xml we can nest a reference tag in the handle. This will allow us to target a specific part of the page. The reference are really only the name that were set on creation of the block. We will come back this later.

### XML Block

Sometimes not often though we might need to add stuff. This is were `blocks` will help you. The `block` is a php class. The block will contain functions that can be called from the template. We decide what functions will be available in the template when we define what `block` it uses. We define this by setting a type to the block.

In a layout xml file we can create a new `block` using the `<block>` tag. We would place the block within reference tags.

{% highlight html %}
<module_index_index>
  <reference name="content">
    <block type="core/text" name="my.block" as="my_block">

    </block>
  </reference>
</module_index_index>
{% endhighlight %}



{% highlight html %}
<cms_index_index>
  <reference name="right">
    <block type="core/text" name="one">
      <action method="setText">
        <text><![CDATA[<p>Some text</p>]]></text>
      </action>
    </block>
  </reference>
</cms_index_index>
{% endhighlight %}

This will add a block to the right sidebar of your page. Just a heads up, this will not work so good if you use a one column layout for the index page. This works for the right sidebar because it is of the block type `core/text_list` this will not work for other types of blocks like `core/template`. This might be something to consider when your `block` dosen't show when you are so sure it should. We will get into why soon.

There are lots of built in blocks in Magento. There are a few examples below and you can also create your own blocks in modules.

{% highlight html %}
core/messages
core/template
core/text
core/text_list
page/html
page/html_breadcrumbs
page/html_footer
page/html_head
page/html_header
page/html_wrapper
page/switch
page/template_links
{% endhighlight %}

### Core Text List

In Magento we think of blocks to content blocks or structural blocks. The `core/text_list` block are a structural block. It is a placeholder for other `blocks` that have content in them. The `core/text_list` will print all blocks added to it automatically. If we add blocks to other blocks that are not of the type `core/text_list` we need to print them out in the template.

Since the `core/text_list` print all blocks automatically and we do not position the child blocks in a template file we need another way too position the blocks. There are two attributes for this, `before` and `after`.

before:

{% highlight html %}
<block type="core/text" name="another.block" before="myblock">
<block type="core/text" name="another.block" before="-" >
<block type="core/text" name="another.block" before="+" >
{% endhighlight %}

after:

{% highlight html %}
<block type="core/text" name="another.block" after="myblock">
<block type="core/text" name="another.block" after="-">
<block type="core/text" name="another.block" after="+">
{% endhighlight %}


### Core Template

Printing a Template in `core/text_list` block. Since a `core/text_list` block prints all children automatically we only need to add the block with the template attached.
In the block declaration we change the `type` to `core/template`. Then we add the `name` attribute. This is the reference we can use if we want to add child blocks or remove the block later. The `name` needs to be unique. The `as` attribute can be ommited in this case. This attribute is needed for printing the block in a template. The `as` attribute only needs to be unique in the template file it is added to. The last attribute `template` is the path to the template file. The path starts from the themes template folder.

{% highlight html %}
<?xml version="1.0"?>
<layout version="0.1.0">
  <default>
    <reference name="right">
      <block type="core/template" name="my.block" as="my_block" template="someblocks/myblock.phtml" />
    </reference>
  </default>
</layout>
{% endhighlight %}

If we want to add a `core/template` block to another `core/template` block we need to nest the second block as child block to the block were we gonna print it. Notice in the first example we use a self closed block tag. In the second example we need to open and close the block with `<block></block>`.

{% highlight html %}
<?xml version="1.0"?>
<layout version="0.1.0">
  <default>
    <reference name=”right”>
      <block type="core/template" name="my.first.block" as="my_first_block" template="mymodule/myfirstblock.phtml">
        <block type="core/template" name="my.second.block" as="my_second_block" template="mymodule/mysecondblock.phtml" />
      </block>
    </reference>
  </default>
</layout>
{% endhighlight %}

This will not actually print the block. The `my.second.block` `block` will be available in the `my.first.block` `block` but to print it we need to call `getChildHtml` in the `myfirstblock.phtml` template file.

{% highlight html %}
<?php echo $this->getChildHtml(’my_second_block’); ?>
{% endhighlight %}

We added the child block when we created the first block but we can also add a child block to a block that already have been created.

{% highlight html %}
<?xml version="1.0"?>
<layout version="0.1.0">
  <default>
    <reference name="right">
      <block type="core/template" name="my.first.block" as="my_first_block" template="mymodule/myfirstblock.phtml"/>
      </block>
    </reference>
    <reference name="my.first.block">
    	<block type="core/template" name="my.second.block" as="my_second_block" template="mymodule/mysecondblock.phtml" />
    </reference>
  </default>
</layout>
{% endhighlight %}

### Actions

We can call an action on a block. An action is simply a function defined in the block. We can call any function that is in the block class we set as type for the block. We can pass parameters to i like any other function. Let's say we want to call the function `setText` from the `core/text` block and we want to pass a text parameter to it. We start with nesting action tags between the block tags. We use the attribute `method` to define what function we are calling. We use `setText` and pass `<![CDATA[<p>Some text</p>]]>` as a parameter.

{% highlight html %}
<cms_index_index>
  <reference name="right">
    <block type="core/text" name="my.first.block">
      <action method="setText">
        <text><![CDATA[<p>Some text</p>]]></text>
      </action>
    </block>
  </reference>
</cms_index_index>
{% endhighlight %}

If we want to find out what other functions are available we can look in the block class. If we look at our block declaration we see type is `core/text`. This would suggest that the block we are using are apart of the `core` module. Let's go to `app > code > core > Mage > core > etc > config.xml`. In this file we find,

{% highlight html %}
<?xml version="1.0"?>
<!--....-->
<config>
  <modules>
    <Mage_Core>
      <version>1.6.0.4</version>
    </Mage_Core>
  </modules>
  <global>
  <!--....-->
    <blocks>
      <core>
        <class>Mage_Core_Block</class>
      </core>
    </blocks>
  <!--....-->
  <global>
  <!--....-->
</config>
{% endhighlight %}

Yes, this module use `core` for block names. We can also see the real class path `Mage_Core_Block`. The second part in `core/text` is `text`. If we add `text` too `Mage_Core_Block` we get `Mage_Core_Block_Text.php`. If we look in `app > code > core > Mage > core > block > Text.php` we find the `setText` function we were using in the layout file.

{% highlight php %}
<?php
class Mage_Core_Block_Text extends Mage_Core_Block_Abstract
{
  public function setText($text)
  {
    $this->setData('text', $text);
    return $this;
  }
}
{% endhighlight %}

Another example is setTemplate.

{% highlight html %}
  <catalog_category_default>
    <reference name="root">
      <action method="setTemplate">
      <template>page/2columns-right.phtml</template>
    </action>
  </reference>
</catalog_category_default>
{% endhighlight %}

We use `core/template` and core still being `Mage_Core_Block`. Adding `template` to `Mage_Core_Block` gives us `Mage_Core_Block_Template.php`. If we look in `app > code > core > Mage > core > block > Template.php` we find,

{% highlight php %}
<?php
public function setTemplate($template)
{
    $this->_template = $template;
    return $this;
}
{% endhighlight %}



Params to method

{% highlight html %}
<block type="my/module" name="my.first.block">
  <action method="myFirstMethod">
    <param1>My first value</param1>
    <param2>My second value</param2>
  </action>
</block>
{% endhighlight %}


Null Param

{% highlight html %}
<block type="my/module" name="my.first.block">
  <action method="myFirstMethod">
    <param1>My first value</param1>
    <param2 />
  </action>
</block>
{% endhighlight %}

Dynamic Params

{% highlight html %}
<block type="some/foo" name ="some_block">
  <action method="myFirstMethod">
    <param1> My first value </param1>
    <param2 helper="customer/getAccountUrl" />
  </action>
</block>
{% endhighlight %}

Translations

The translate attribute is what variable that needs to be translated. Module is with what module the variable it should be translated with.

{% highlight html %}
<action method="myFirstMethod" translate="param1" module="core">
  <param1>a value</param1>
  <param2>27</param2>
</action>
{% endhighlight %}

### Selected Actions

There are a lot of functions we can call from blocks. Some often used actions are for adding CSS and JS files to our layout handles.

This will get the ”myscript.js” file from the ”myscript” directory in the JS folder in the Magento root.

{% highlight html %}
<action method="addJs">
  <script>myscripts/myscript.js</script>
</action>
{% endhighlight %}

This will also get the ”myscript.js” file from the ”myscript” directory in the JS folder in the Magento root.

{% highlight html %}
<action method="addItem">
  <type>js</type>
  <name>myscripts/myscript.js</name>
  <params/><if>lt IE 7</if>
</action>
{% endhighlight %}

This will get the ”myscript.js” file from the my ”js” directory in the theme folder.

{% highlight html %}
<action method="addItem">
  <type>skin_js</type>
  <name>js/myscript.js</name>
</action>
{% endhighlight %}

This will get the ”mystyle.css” file from the my ”css” directory in the theme folder.

{% highlight html %}
<action method="addCss">
  <stylesheet>css/mystyle.css</stylesheet>
</action>
{% endhighlight %}

This will also get the ”mystyle.css” file from the my ”css” directory in the theme folder.

{% highlight html %}
<action method="addItem">
  <type>skin_css</type>
  <name>css/ajaxbuy.css</name>
</action>
{% endhighlight %}


We can also add a css class to the html body.

{% highlight html %}
<reference name="root">
  <action method="addBodyClass">
    <classname>this-is-a-class</classname>
  </action>
</reference>
{% endhighlight %}

This would add a css class to the body of all bundled products.

{% highlight html %}
<?xml version="1.0"?>
<layout>
    <PRODUCT_TYPE_bundle>
        <reference name="root">
            <action method="addBodyClass">
                <classname>product-bundle</classname>
            </action>
        </reference>
    </PRODUCT_TYPE_bundle>
</layout>
{% endhighlight %}


### Updates

Or update more than one page at the time with a update handle.

Add a already defined layout handle to other handles.
We can reuse the same in other layout handles.
If when need to add the same changes to other handles
we can use the update handle.

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



### If Config

Use if config in xml
The if config needs to be on the action method.

{% highlight html %}
<block type="page/html_head" name="head" as="head">
  <action method="addJs" ifconfig="dev/js/deprecation" >
    <script>prototype/deprecation.js</script>
  </action>
</block>
{% endhighlight %}



### Helper

Call a helper in xml

{% highlight html %}
<action method="setTemplate">
  <template helper="module/helper/setValue"/>
</action>
{% endhighlight %}
