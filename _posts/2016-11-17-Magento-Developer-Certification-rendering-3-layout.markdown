---
layout: post
title:  Magento Developer Certification Rendering and Design layout, XML schema, and CMS content directives
date:   2016-11-17 18:00:00
categories: Magento
---

Notes about `Magento Developer Certification Rendering and Design layout, XML schema, and CMS content directives`.

3 - Rendering
====================

Design layout, XML schema, and CMS content directives
--------------------

### Describe the elements of Magento's layout XML schema, including the major layout directives:

#### How are `<update />`, `<block />`, and `<action />` used in Magento layout?

* `<update />` handle allows us to add an additional handle to the current handle.

`<update handle="customer_account" />`

* `<block />` Adding Child blocks

`<block type="wishlist/customer_sharing" name="wishlist.sharing" template="wishlist/sharing.phtml" />`

* `<action />` calls a method in the block.

`<action method="unsetChild"><name>wishlist_customer_sidebar</name></action>`


#### Which classes and methods determine which nodes from layout XML correspond to certain URLs?

[Mage_Core_Controller_Varien_Action::loadLayout()][Mage_Core_Controller_Varien_Action::loadLayout]
[Mage_Core_Controller_Varien_Action::addActionLayoutHandles()][Mage_Core_Controller_Varien_Action::addActionLayoutHandles]

These code references can be used as an entry point to find answers to the questions
above:

* [Mage_Core_Model_Layout][Mage_Core_Model_Layout]
* [Mage_Core_Model_Layout_Update][Mage_Core_Model_Layout_Update]
* [Mage_Core_Block_Abstract][Mage_Core_Block_Abstract]

### Register layout XML files:

We can add an xml file in our modules etc/config.xml file.

#### How can layout XML files be registered for the frontend and adminhtml areas?

{% highlight xml %}
<frontend>
 <layout>
  <updates>
   <core>
    <file>core.xml</file>
   </core>
  </updates>
 </layout>
</frontend>
{% endhighlight %}

{% highlight xml %}
<adminhtml>
 <layout>
  <updates>
   <sales>
    <file>sales.xml</file>
   </sales>
  </updates>
 </layout>
<adminhtml>
{% endhighlight %}

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Core_Model_Layout_Update][Mage_Core_Model_Layout_Update]

### Create and add code to pages:



#### How can code be modified or added to Magento pages using the following methods?

##### Template customizations

We can change the template of an existing block.

{% highlight xml %}
<reference name="root">
 <action method="setTemplate"><template>page/1column.phtml</template></action>
</reference>
{% endhighlight %}

Or we can add a new block.

{% highlight xml %}
<reference name="content">
 <block type="core/template" name="default_home_page" template="cms/default/home.phtml"/>
</reference>
{% endhighlight %}

##### Layout customizations

We can change the layout with `xml` files. If we have a module we can add an layout `xml` file. We add the following to the `etc/config.xml`.

{% highlight xml %}
<frontend>
 <layout>
  <updates>
   <core>
    <file>core.xml</file>
   </core>
  </updates>
 </layout>
</frontend>
{% endhighlight %}

Layout changes can also be made in the theme if we add an `local.xml` file. Or if we want to change the layout on products and categories we can do that in Magentos admin.

* Catalog > Manage Categories > {Category} > Custom Design
	* Custom Design
	* Active From
	* Active To

* Catalog > Manage Products > {Product} > Design
	* Custom Layout Update

##### Overriding block classes

If our module we can create our own blocks. If we create a block that extends [Mage_Core_Block_Template][Mage_Core_Block_Template] we can use it to add templates in our layout xml file.

{% highlight xml %}
<global>
 <blocks>
  <mymodule>
   <class>My_Module_Block</class>
  </mymodule>
 </blocks>
</global>
{% endhighlight %}

{% highlight php %}
<?php
class My_Module_Block_Template extends Mage_Core_Block_Template
{ //... }
{% endhighlight %}

{% highlight xml %}
<reference name="content">
 <block type="mymodule/template" name="override_home_page" template="cms/default/home.phtml"/>
</reference>
{% endhighlight %}

##### Registering observers on general block events

In [Mage_Core_Block_Abstract::setLayout][Mage_Core_Block_Abstract::setLayout] Magento throws two events.

* `core_block_abstract_prepare_layout_before`
* `core_block_abstract_prepare_layout_after`

{% highlight php %}
`<?php
public function setLayout(Mage_Core_Model_Layout $layout)
{
 $this->_layout = $layout;
 Mage::dispatchEvent('core_block_abstract_prepare_layout_before', array('block' => $this));
 $this->_prepareLayout();
 Mage::dispatchEvent('core_block_abstract_prepare_layout_after', array('block' => $this));
 return $this;
}`
{% endhighlight %}

{% highlight xml %}
<core_block_abstract_prepare_layout_before>
 <observers>
  <somemodule>
   <type>singleton</type>
   <class>somemodule/observer</class>
   <method>doStuffBefore</method>
  </somemodule>
 </observers>
</core_block_abstract_prepare_layout_before>
{% endhighlight %}

{% highlight xml %}
<core_block_abstract_prepare_layout_after>
 <observers>
  <somemodule>
   <type>singleton</type>
   <class>somemodule/observer</class>
   <method>doStuffAfter</method>
  </somemodule>
 </observers>
</core_block_abstract_prepare_layout_after>
{% endhighlight %}

#### In which circumstances are each of the above methods more or less appropriate than others?

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Core_Controller_Varien_Action][Mage_Core_Controller_Varien_Action]
* `Mage/Core/Block/*`
* [Mage_Core_Block_Abstract][Mage_Core_Block_Abstract]
* [Mage_Core_Block_Template][Mage_Core_Block_Template]
* [Mage_Core_Block_Text][Mage_Core_Block_Text]
* [Mage_Core_Block_Text_List][Mage_Core_Block_Text_List]
* [Mage_Page_Block_Html_Head][Mage_Page_Block_Html_Head]

### Explain how variables can be passed to block instances via layout XML:

In `xml` we can add an action to a `block`. The method we define is a `function` in the `block` `class`. In the method below we can se that we add a `page/html_head` ([Mage_Page_Block_Html_Head][Mage_Page_Block_Html_Head]) block. And we call the method [addJs][Mage_Page_Block_Html_Head::addJs]. This tells us that there is a method called [addJs][Mage_Page_Block_Html_Head::addJs] in [Mage_Page_Block_Html_Head][Mage_Page_Block_Html_Head]. The text between the `<script>` nodes are the variable we are passing to the `function`.

{% highlight xml %}
<block type="page/html_head" name="head" as="head">
 <action method="addJs">
  <script>prototype/prototype.js</script>
 </action>                
</block>
{% endhighlight %}

{% highlight php %}
<?php
class Mage_Page_Block_Html_Head extends Mage_Core_Block_Template
{
 public function addJs($name, $params = "")
 {
  $this->addItem('js', $name, $params);
  return $this;
 }
}
{% endhighlight %}

#### How can variables be passed to the block using the following methods?

##### From layout xml file

##### From controller

##### From one block to another

##### From an arbitrary location (for example, install/upgrade scripts,models)

#### In which circumstances are each of the above methods more or less appropriate than others?


#### These code references can be used as an entry point to find answers to the questions above:
* [Mage_Core_Model_Layout][Mage_Core_Model_Layout]
* [Mage_Core_Controller_Varien_Action][Mage_Core_Controller_Varien_Action]
* `Mage/Core/Block/*`
* [Mage_Core_Block_Abstract][Mage_Core_Block_Abstract]
* [Mage_Core_Block_Template][Mage_Core_Block_Template]
* [Mage_Core_Block_Text][Mage_Core_Block_Text]
* [Mage_Core_Block_Text_List][Mage_Core_Block_Text_List]
* [Mage_Page_Block_Html_Head][Mage_Page_Block_Html_Head]

### Describe various ways to add and customize JavaScript to specific request scopes:

#### Which block is responsible for rendering JavaScript in Magento?

#### Which modes of including JavaScript does Magento support?

#### Which classes and files should be checked if a link to a custom JavaScript file isn’t being rendered on a page?



#### These code references can be used as an entry point to find answers to the questions above:
* `Mage/Core/Block/*`
* [Mage_Core_Block_Abstract][Mage_Core_Block_Abstract]
* [Mage_Core_Block_Template][Mage_Core_Block_Template]
* [Mage_Core_Block_Text][Mage_Core_Block_Text]
* [Mage_Core_Block_Text_List][Mage_Core_Block_Text_List]
* [Mage_Page_Block_Html_Head][Mage_Page_Block_Html_Head]

#### General References for this section:
* [Mage_Core_Model_Layout][Mage_Core_Model_Layout]
* [Mage_Core_Model_Layout_Update][Mage_Core_Model_Layout_Update]
* [Mage_Core_Model_Design][Mage_Core_Model_Design]
* [Mage_Core_Model_Design_Package][Mage_Core_Model_Design_Package]
* [Mage_Core_Controller_Varien_Action][Mage_Core_Controller_Varien_Action]

#### Additional Readings



[Mage_Core_Block_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Block/Abstract.php
[Mage_Core_Block_Abstract::setLayout]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Block/Abstract.php
[Mage_Core_Block_Template]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Block/Template.php
[Mage_Core_Block_Text]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Block/Text.php
[Mage_Core_Block_Text_List]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Block/Text/List.php
[Mage_Core_Controller_Varien_Action]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Controller/Varien/Action.php
[Mage_Core_Controller_Varien_Action::loadLayout]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Controller/Varien/Action.php#L249
[Mage_Core_Controller_Varien_Action::addActionLayoutHandles]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Controller/Varien/Action.php#L275
[Mage_Core_Model_Design]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Design.php
[Mage_Core_Model_Design_Package]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Design/Package.php
[Mage_Core_Model_Layout]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Layout.php
[Mage_Core_Model_Layout_Update]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Layout/Update.php
[Mage_Page_Block_Html_Head]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Page/Block/Html/Head.php
[Mage_Page_Block_Html_Head::addJs]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Page/Block/Html/Head.php#L66
[layout_wishlist]:https://github.com/AndersWik/Magento-1x/blob/master/app/design/frontend/base/default/layout/wishlist.xml
[layout_core]:https://github.com/AndersWik/Magento-1x/blob/master/app/design/frontend/base/default/layout/core.xml
[layout_sales]:https://github.com/AndersWik/Magento-1x/blob/master/app/design/frontend/base/default/layout/sales.xml
[layout_cms]:https://github.com/AndersWik/Magento-1x/blob/master/app/design/frontend/base/default/layout/cms.xml
