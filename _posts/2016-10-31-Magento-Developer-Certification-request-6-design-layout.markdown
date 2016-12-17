---
layout: post
title:  Magento Developer Certification Request Flow and Design and layout initialization
date:   2016-11-07 18:00:00
categories: Magento
---

Notes about `Magento Developer Certification the Request Flow and Design and layout initialization`.

2 - Request Flow
====================

Design and layout initialization
--------------------

### Identify the steps in the request flow in which:

#### Design data is populated

[Mage/Sales/etc/config.xml][Mage_Sales_Etc_Config]

{% highlight xml %}
<layout>
    <updates>
        <sales module="Mage_Sales">
            <file>sales.xml</file>
        </sales>
        <!-- -->
    </updates>
</layout>
{% endhighlight %}

[app/design/frontend/base/default/layout/sales.xml][Base_Default_Layout_Sales]



[Mage_Core_Controller_Varien_Action::loadLayout()][Mage_Core_Controller_Varien_Action::loadLayout]

`$this->loadLayoutUpdates();`

[Mage_Core_Controller_Varien_Action::loadLayoutUpdates()][Mage_Core_Controller_Varien_Action::loadLayoutUpdates]

`$this->getLayout()->getUpdate()->load();`

[Mage_Core_Controller_Varien_Action::getLayout()][Mage_Core_Controller_Varien_Action::getLayout]

{% highlight php %}
<?php
abstract class Mage_Core_Controller_Varien_Action
{
 public function getLayout()
 {
  return Mage::getSingleton('core/layout');
 }
}
{% endhighlight %}

[Mage_Core_Model_Layout][Mage_Core_Model_Layout]
[Mage_Core_Model_Layout::getUpdate()][Mage_Core_Model_Layout::getUpdate] `returns` the variable `_update` that is  an instance of `Mage_Core_Model_Layout_Update`. The variable is set in the `__construct` `function` (`$this->_update = Mage::getModel('core/layout_update')`)

{% highlight php %}
`<?php
abstract class Mage_Core_Controller_Varien_Action
{
 public function getUpdate()
 {
  return $this->_update;
 }
}`
{% endhighlight %}

load();
$this->merge($handle);

public function merge($handle)
{}

public function fetchPackageLayoutUpdates($handle)
{}

if (empty($this->_packageLayout)) {
 $this->fetchFileLayoutUpdates();
}

`fetchFileLayoutUpdates`

`getFileLayoutUpdatesXml`

`$this->generateLayoutXml();`


[Mage_Core_Controller_Varien_Action::generateLayoutXml()][Mage_Core_Controller_Varien_Action::generateLayoutXml]

`$this->getLayout()->generateXml();`

[Mage_Core_Model_Layout::generateXml()][Mage_Core_Model_Layout::generateXml]

In this method we call `$this->getUpdate()->asSimplexml()` and we get our `Mage_Core_Model_Layout_Update` instance and call the function [asSimplexml()][Mage_Core_Model_Layout_Update::asSimplexml].

{% highlight php %}
<?php
class Mage_Core_Model_Layout_Update
{
 public function asSimplexml()
 {
  $updates = trim($this->asString());
  $updates = '<'.'?xml version="1.0"?'.'><layout>'.$updates.'</layout>';
  return simplexml_load_string($updates, $this->getElementClass());
 }
}
{% endhighlight %}



`$this->generateLayoutBlocks();`



#### Layout configuration files are parsed

#### Layout is compiled

#### Output is rendered

#### The design configuration is part of Magento's view implementation. This objective covers the processing of these XML instructions.

#### Which ways exist to specify the layout update handles that will be processed during a request?

#### Which classes are responsible for the layout being loaded?

#### How are layout xml directives processed?

#### Which configuration adds a file containing layout xml updates to a module?

#### Why is the load order of layout xml files important?

#### These code references can be used as an entry point to find answers to the questions above:

* `Mage_Core_Controller_Varien_Action::loadLayout()`
* `Mage_Core_Model_Layout::__construct()`
* `Mage_Core_Model_Layout_Update::load()`

#### Additional Readings

* [Alan Storm: No Frills Magento Layout][alanstorm.no-frills-layout]



[alanstorm.no-frills-layout]:http://store.pulsestorm.net/products/no-frills-magento-layout

[index.php]:https://github.com/AndersWik/Magento-1x/blob/master/index.php
[index.php-Mage::run]:https://github.com/AndersWik/Magento-1x/blob/master/index.php#L83

[Mage]:https://github.com/AndersWik/Magento-1x/blob/master/app/Mage.php
[Mage::app]:https://github.com/AndersWik/Magento-1x/blob/master/app/Mage.php#L606
[Mage::run]:https://github.com/AndersWik/Magento-1x/blob/master/app/Mage.php#L662

[Mage_Catalog_Model_Url]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Catalog/Model/Url.php

[Mage_Core_Model_App]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php
[Mage_Core_Model_App::init]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php#L265
[Mage_Core_Model_App::baseinit]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php#L297

[Mage_Core_Model_App::run]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php#L345
[Mage_Core_Model_App::run->getFrontController()->dispatch()]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php#L365

[Mage_Core_Model_App::_initBaseConfig]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php#L388
[Mage_Core_Model_App::_initModules]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php#L422
[Mage_Core_Model_App::_initFrontController]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php#L759
[Mage_Core_Model_App::getFrontController]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php#L1110

[Mage_Core_Model_Config]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Config.php
[Mage_Core_Model_Config::loadModules]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Config.php

[Mage_Core_Model_Url_Rewrite]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Url/Rewrite.php
[Mage_Core_Model_Url_Rewrite::rewrite]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Url/Rewrite.php#L196

[Mage_Core_Controller_Varien_Front]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Controller/Varien/Front.php
[Mage_Core_Controller_Varien_Front::addRouter]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Controller/Varien/Front.php#L90
[Mage_Core_Controller_Varien_Front::init]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Controller/Varien/Front.php#L126
[Mage_Core_Controller_Varien_Front::dispatch]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Controller/Varien/Front.php#L156

[Mage_Core_Controller_Varien_Router_Standard]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Controller/Varien/Router/Standard.php
[Mage_Core_Controller_Varien_Router_Standard::collectRoutes]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Controller/Varien/Router/Standard.php#L33
[Mage_Core_Controller_Varien_Router_Standard::match]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Controller/Varien/Router/Standard.php#L110

[Mage_Core_Controller_Varien_Action]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Controller/Varien/Action.php
[Mage_Core_Controller_Varien_Action::loadLayout]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Controller/Varien/Action.php#L249
[Mage_Core_Controller_Varien_Action::loadLayoutUpdates]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Controller/Varien/Action.php#L294
[Mage_Core_Controller_Varien_Action::getLayout]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Controller/Varien/Action.php#L236
[Mage_Core_Controller_Varien_Action::generateLayoutXml]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Controller/Varien/Action.php#L312


[Mage_Core_Model_Layout]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Layout.php
[Mage_Core_Model_Layout::getUpdate]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Layout.php#L97
[Mage_Core_Model_Layout::generateXml]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Layout.php#L151

[Mage_Core_Model_Layout_Update]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Layout/Update.php
[Mage_Core_Model_Layout_Update::asSimplexml]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Layout/Update.php#L231

[Mage_Core_Model_Layout_Update::fetchFileLayoutUpdates]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Layout/Update.php

[Mage_Core_Model_Layout_Update::getFileLayoutUpdatesXml]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Layout/Update.php#L409

[Mage_Sales_Etc_Config]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Sales/etc/config.xml
[Base_Default_Layout_Sales]:https://github.com/AndersWik/Magento-1x/blob/master/app/design/frontend/base/default/layout/sales.xml
