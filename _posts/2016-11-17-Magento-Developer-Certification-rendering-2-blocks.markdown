---
layout: post
title:  Magento Developer Certification Rendering and Blocks
date:   2016-11-17 18:00:00
categories: Magento
---

Notes about `Magento Developer Certification Rendering and Blocks`.

3 - Rendering
====================

Blocks
--------------------


### Describe the programmatic structure of blocks:

#### What are blocks used for in Magento?

Blocks separate logic from design. We can call methods in the block from the template using `$this`.

#### What is the parent block for all Magento blocks?

[Mage_Core_Block_Abstract][Mage_Core_Block_Abstract]

#### Which class does each block that uses a template extend?

[Mage_Core_Block_Template][Mage_Core_Block_Template] that in turn extends [Mage_Core_Block_Abstract][Mage_Core_Block_Abstract]

#### In which way does a template block store information about its template file? Does it store an absolute or a relative path to the template?

The template file is relative to the theme. If we have the file path `app/design/{packagename}/{themename}/template/email/order/items.phtml` only the part after the theme name is stored (`/template/email/order/items.phtml`).

[Mage_Core_Block_Template][Mage_Core_Block_Template]
[Mage_Core_Block_Template::getTemplate()][Mage_Core_Block_Template::getTemplate]
[Mage_Core_Block_Template::setTemplate()][Mage_Core_Block_Template::setTemplate]

* What is the role of the `Mage_Core_Block_Abstract` class?

This class gives the blocks their basic functionality.

* getParentBlock
* setParentBlock
* getBlockAlias
* setBlockAlias
* setChild
* unsetChild
* getChild

etc..

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Core_Model_Layout][Mage_Core_Model_Layout]
* [Mage_Core_Model_Layout_Update][Mage_Core_Model_Layout_Update]
* [Mage_Core_Block_Template][Mage_Core_Block_Template]
* [Mage_Core_Block_Abstract][Mage_Core_Block_Abstract]
* [Mage_Adminhtml_Block_Abstract][Mage_Adminhtml_Block_Abstract]

### Describe the relationship between templates and blocks:

Blocks separate logic from design. We can call methods in the block from the template using `this`. We can also call different methods of the blocks from `xml`.

{% highlight xml %}
<block type="core/text" name="some_text">
 <action method="setText">
  <text><![CDATA[Some Text]]></text>
 </action>
</block>
{% endhighlight %}

When we create a `template` `block` in `xml` we can call the `setTemplate` `function` and define what `template` file the `block` are going to use.

{% highlight xml %}
<block type="core/template" name="some_template">
 <action method="setTemplate">
  <template>some/template.phtml</template>
 </action>
</reference>
{% endhighlight %}

For blocks we can also use the template attribute on the block. It will do the same thing.

{% highlight xml %}
<block type="core/template" name="some_template" template="some/template.phtml"/>
{% endhighlight %}

#### Can any block in Magento use a template file?

Only [Mage_Core_Block_Template][Mage_Core_Block_Template] or blocks that inherit from [Mage_Core_Block_Template][Mage_Core_Block_Template]

#### How does the $this variable work inside the template file?

With this we can call `functions` in the `block`.

#### Is it possible to render a template without a block in Magento?

With native Magento, no.

#### Is it possible to have a block without a template in Magento?

Yes, examples of other blocks are

* `core/text`
* `core/text_list`

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Core_Block_Template][Mage_Core_Block_Template]
* [Mage_Core_Block_Abstract][Mage_Core_Block_Abstract]

### Describe the stages in the lifecycle of a block:


#### Which class is responsible for creating an instance of the block?

* [Mage_Core_Model_Layout::createBlock()][Mage_Core_Model_Layout::createBlock]

#### Which class is responsible for figuring out which blocks should be created for certain pages?

* [Mage_Core_Controller_Varien_Action][Mage_Core_Controller_Varien_Action]
* [Mage_Core_Controller_Varien_Action::loadLayout()][Mage_Core_Controller_Varien_Action::loadLayout]

#### How is the tree of blocks typically rendered?

* `$this->renderLayout();`

#### Is it possible to create an instance of the block and render it on the page without using the Magento layout?

With native Magento you should use the layout object.

#### Is it possible to create an instance of the block and add it to the current layout manually?

{% highlight php %}
<?php
class My_Module_IndexController extends Mage_Core_Controller_Front_Action
{
 public function indexAction()
 {
   $this->loadLayout();

   $block = $this->getLayout()->createBlock(
    'Mage_Core_Block_Template',
    'my_module_block_name',
    array('template' => 'my/module/template.phtml')
   );

   $this->getLayout()->getBlock('content')->append($block);
   $this->renderLayout();
 }
}
{% endhighlight %}


#### How are a block’s children rendered? Once you added a child to the block, can you expect it will be rendered automatically?

If a block is added as child `block` to a `template` `block` or a `block` that extends a template block the child block needs to be printed in the template.

{% highlight xml %}
<default translate="label" module="page">
 <label>All Pages</label>
 <block type="page/html" name="root" output="toHtml" template="page/3columns.phtml">
  <!--- ... --->
  <block type="core/text_list" name="content" as="content" translate="label">
   <label>Main Content Area</label>
  </block>
  <!--- ... --->
 </block>
</default>
{% endhighlight %}

{% highlight php %}
<?php echo $this->getChildHtml('content') ?>
{% endhighlight %}

If a `block` is added as a child `block` to a `core/text_list` it will be rendered automatically.

{% highlight xml %}
<cms_index_defaultindex>
 <!--- ... --->
 <reference name="content">
  <block type="core/template" name="default_home_page"
    template="cms/default/home.phtml"/>
 </reference>
</cms_index_defaultindex>
{% endhighlight %}

#### What is a difference in rendering process for different types of blocks?

Some blocks like `core/text_list`s are rendered automatically. Block that are `core/template`s need to be printed with

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Core_Model_Layout][Mage_Core_Model_Layout]
* [Mage_Core_Model_Layout_Update][Mage_Core_Model_Layout_Update]
* [Mage_Core_Block_Template][Mage_Core_Block_Template]
* [Mage_Core_Block_Abstract][Mage_Core_Block_Abstract]
* [Mage_Core_Block_Text][Mage_Core_Block_Text]
* [Mage_Core_Block_Text_List][Mage_Core_Block_Text_List]

### Describe events fired in blocks:

* `core_block_abstract_to_html_before`
* `core_block_abstract_to_html_after`

#### How can block output be caught using an observer?

{% highlight xml %}
<global>
 <events>
  <core_block_abstract_to_html_before>
   <observers>
    <mymodule>
     <class>mymodule/observer</class>
     <method>dostuff</method>
    </mymodule>
   </observers>
  </core_block_abstract_to_html_before>
 </events>
</global>
{% endhighlight %}

{% highlight php %}
`<?php
class My_Module_Model_Observer
{
  public function dostuff($observer = null)
  {
    $_block = $observer->getBlock();
  }
}`
{% endhighlight %}

#### What events do Mage_Core_Block_Abstract and Mage_Core_Block_Template fire?

* `core_block_abstract_prepare_layout_before`
* `core_block_abstract_prepare_layout_after`
* `core_block_abstract_to_html_before`
* `core_block_abstract_to_html_after`

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Core_Block_Abstract][Mage_Core_Block_Abstract]

### Identify different types of blocks:

#### What is the purpose of each of the following block types:
* [Mage_Core_Block_Template][Mage_Core_Block_Template]
    * The template block allows us to add a template file to the block.
* [Mage_Core_Block_Text_List][Mage_Core_Block_Text_List]
    * The text list does not have a template. We can add other blocks to this block and they will be automatically rendered.
* [Mage_Core_Block_Text][Mage_Core_Block_Text]
    * This block does not have a template. We can add a text to the block.

#### Which block type renders its children automatically?

* [Mage_Core_Block_Text_List][Mage_Core_Block_Text_List]

#### Which block type is usually used for a “content” block on Magento pages?

* [Mage_Core_Block_Template][Mage_Core_Block_Template]

#### These code references can be used as an entry point to find answers to the questions above:
* `Mage/Core/Block/*`
* [Mage_Core_Block_Abstract][Mage_Core_Block_Abstract]
* [Mage_Core_Block_Template][Mage_Core_Block_Template]
* [Mage_Core_Block_Text][Mage_Core_Block_Text]
* [Mage_Core_Block_Text_List][Mage_Core_Block_Text_List]
* [Mage_Page_Block_Html_Head][Mage_Page_Block_Html_Head]

### Describe block instantiation:

#### How can a template’s block instance be accessed inside the template file, and how can other block instances be accessed?

We can use `$this`.

#### How can block instances be accessed from the controller?

* `$this->getLayout()->createBlock('adminhello/adminhtml_export');`
* `this->getLayout->getBlock('head');`

#### How can block instances be accessed inside install scripts or other model class instances?

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Core_Model_Layout][Mage_Core_Model_Layout]
* [Mage_Core_Model_Layout_Update][Mage_Core_Model_Layout_Update]
* [Mage_Core_Controller_Varien_Action][Mage_Core_Controller_Varien_Action]

### Explain different mechanisms for disabling block output:

#### In which ways can block output be disabled in Magento?

We can disable module output in Magentos admin. `System > Config > Advanced > Modules Disable Output`. Here we can stop modules from rendering their blocks.
The check is done in [Mage_Core_Block_Abstract::toHtml()][Mage_Core_Block_Abstract::toHtml]. If the disable option for the module is true `""` is `returned`.

{% highlight php %}
<?php
abstract class Mage_Core_Block_Abstract extends Varien_Object
{
 final public function toHtml()
 {
  if (Mage::getStoreConfig('advanced/modules_disable_output/' . $this->getModuleName()))
  {
   return '';
  }
 }
}
{% endhighlight %}

We can also disable a block output with `xml`. If we want to remove the head block we could use `<remove name="head">`. This would prevent the block from being rendered.

#### Which method can be overridden to control block output?

The `_toHtml()` function of the block.

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Core_Model_Layout][Mage_Core_Model_Layout]

### Describe how a typical block is rendered:

All block extends [Mage_Core_Block_Abstract][Mage_Core_Block_Abstract]. When a block is rendered the [Mage_Core_Block_Abstract::toHtml()][Mage_Core_Block_Abstract::toHtml] function is called. This method call `$html = $this->_toHtml();`. The `_toHtml()` method is implemented in the child class ([Mage_Core_Block_Template::_toHtml][Mage_Core_Block_Template::_toHtml]).

#### Which class performs rendering of the template?

* [Mage_Core_Block_Template][Mage_Core_Block_Template]

#### Which classes are responsible for figuring out the absolute path for including the template file?

* [Mage_Core_Block_Template::getTemplateFile()][Mage_Core_Block_Template::getTemplateFile]
* [Mage_Core_Model_Design_Package::getTemplateFilename()][Mage_Core_Model_Design_Package::getTemplateFilename]

#### In which method are templates rendered?

* [Mage_Core_Block_Template::_toHtml()][Mage_Core_Block_Template::_toHtml]
* [Mage_Core_Block_Template::renderView()][Mage_Core_Block_Template::renderView]
* [Mage_Core_Block_Template::fetchView()][Mage_Core_Block_Template::fetchView]

#### How can output buffering be enabled/disabled when templates are rendered?

#### These code references can be used as an entry point to find answers to the questions above:
* [Mage_Core_Model_Layout][Mage_Core_Model_Layout]
* [Mage_Core_Model_Layout_Update][Mage_Core_Model_Layout_Update]
* [Mage_Core_Block_Template][Mage_Core_Block_Template]
* [Mage_Core_Block_Abstract][Mage_Core_Block_Abstract]




Additional Readings

* [Nathan McBride: Blocks][brideo.url-blocks]
* [Alan Storm: No Frills Magento Layout][alanstorm.no-frills-layout]


[alanstorm.no-frills-layout]:http://store.pulsestorm.net/products/no-frills-magento-layout
[brideo.url-blocks]:http://brideo.co.uk/magento-certification-notes/rendering/Blocks/


[Mage_Adminhtml_Block_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Adminhtml/Block/Abstract.php

[Mage_Core_Block_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Block/Abstract.php

[Mage_Core_Block_Abstract::toHtml]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Block/Abstract.php#L908

[Mage_Core_Block_Template]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Block/Template.php


[Mage_Core_Block_Template::_toHtml]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Block/Template.php#L281

[Mage_Core_Block_Template::renderView]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Block/Template.php#L269

[Mage_Core_Block_Template::fetchView]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Block/Template.php#L209

[Mage_Core_Block_Template::getTemplateFile]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Block/Template.php#L122

[Mage_Core_Block_Template::getTemplate]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Block/Template.php#L100
[Mage_Core_Block_Template::setTemplate]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Block/Template.php#L111

[Mage_Core_Block_Text]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Block/Text.php
[Mage_Core_Block_Text_List]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Block/Text/List.php

[Mage_Core_Controller_Varien_Action]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Controller/Varien/Action.php
[Mage_Core_Controller_Varien_Action::loadLayout]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Controller/Varien/Action.php#L249

[Mage_Core_Model_Design_Package::getTemplateFilename]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Design/Package.php#L463

[Mage_Core_Model_Layout]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Layout.php
[Mage_Core_Model_Layout::createBlock]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Layout.php#L434
[Mage_Core_Model_Layout_Update]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Layout/Update.php

[Mage_Page_Block_Html_Head]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Page/Block/Html/Head.php
