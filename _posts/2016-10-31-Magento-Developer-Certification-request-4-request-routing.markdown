---
layout: post
title:  Magento Developer Certification Request Flow and Request routing
date:   2016-11-06 18:00:00
categories: Magento
---

Notes about `Magento Developer Certification the Request Flow and Request routing`.

2 - Request Flow
====================

Request routing
--------------------


### Describe request routing/request flow in Magento

* All requests go to `index.php`
* Magento application is inistantiated
* Front controller object inistantiated
* Front controller inistantiates routers
* Routers check request url to find match
* Routers send request to appropriate controller
* Call controller action
* Layout Object generates nested block tree
* Layout Starts Rendering
* Blocks refer to models to get their data

### Describe how Magento determines which controller to use and how to customize route-to-controller resolution

{% highlight xml %}
<admin>
 <routers>
  <adminhtml>
   <args>
    <modules>
     <widget before="Mage_Adminhtml">Mage_Widget_Adminhtml</widget>
    </modules>
   </args>
  </adminhtml>
 </routers>
</admin>
{% endhighlight %}

#### Starting with the front controller delegating the process of mapping a request to a controller action, study the steps that occur until a controller action is dispatched.

[Index.php][index.php]
[Mage::run()][Mage::run]
[Mage_Core_Controller_Varien_Front::dispatch()][Mage_Core_Controller_Varien_Front::dispatch]

{% highlight php %}
    -> Router Admin ->
Custom Router   Router Standard
     <- CMS Router <-
{% endhighlight %}

Match()
* Check if current request can be routed by the router
* If yes create an instance of controller and call action method


#### Which routers exist in a native Magento implementation?

* `Mage_Core_Controller_Varien_Router_Admin`
  * Process admin scope requests
* `Mage_Core_Controller_Varien_Router_Standard`
  * Process frontend scope requests
* `Mage_Cms_Controller_Router`
  * Process CMS pages
* `Mage_Core_Controller_Varien_Router_Default`
  * Process no-route (404)

#### How does the standard router map a request to a controller class?

If we look in the `math()` function of `Mage_Core_Controller_Varien_Router_Standard` we find the `math()` `function`. Before the `function` try to math the request it uses `_beforeModuleMatch()` to see if it is a admin route.

{% highlight php %}
<?php
class Mage_Core_Controller_Varien_Router_Standard extends Mage_Core_Controller_Varien_Router_Abstract
{
 protected function _beforeModuleMatch()
 {
  if (Mage::app()->getStore()->isAdmin()) {
   return false;
  }
  return true;
 }
 public function match(Zend_Controller_Request_Http $request)
 {
  //checking before even try to find out that current module
  //should use this router
  if (!$this->_beforeModuleMatch()) {
  return false;
  }
 }
}
{% endhighlight %}

{% comment %}
Fix "__" breaking color highlighting in atom.
{% endcomment %}

#### How does the standard router build the filesystem path to a file that might contain a matching action controller?

#### How does Magento process requests that cannot be mapped?

Magento sends it to the default router that handles no-route (404) requests.

#### After a matching action controller is found, what steps occur before the action method is executed?

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Core_Controller_Varien_Front::init()][Mage_Core_Controller_Varien_Front::init]
* [Mage_Core_Controller_Varien_Router_Standard::collectRoutes()][Mage_Core_Controller_Varien_Router_Standard::collectRoutes] and [match()][Mage_Core_Controller_Varien_Router_Standard::match]

#### Additional Readings




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
