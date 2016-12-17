---
layout: post
title:  Magento Developer Certification Request Flow and Front Controller
date:   2016-10-31 18:00:00
updated:   2016-11-07 18:00:00
categories: Magento
---

Notes about `Magento Developer Certification the Request Flow and the Front Controller`.

2 - Request Flow
====================

Front Controller
--------------------

### Describe the role of the front controller

The Front controller is [Mage_Core_Controller_Varien_Front][Mage_Core_Controller_Varien_Front] and it gathers all routes. It is the [init()][Mage_Core_Controller_Varien_Front::init] `function` of [Mage_Core_Controller_Varien_Front][Mage_Core_Controller_Varien_Front] that collects the routers. In a native Magento installation there are four routers.

* `Mage_Core_Controller_Varien_Router_Admin`
* `Mage_Core_Controller_Varien_Router_Standard`
* `Mage_Cms_Controller_Router`
* `Mage_Core_Controller_Varien_Router_Default`


After the routers are collected the [dispatch()][Mage_Core_Controller_Varien_Front::dispatch] `function` loops thru the routers and try to find a match for the url.




### Identify uses for events fired in the front controller

`class Mage_Core_Controller_Varien_Front`

* `Mage::dispatchEvent('controller_front_init_before', array('front'=>$this));`
* `Mage::dispatchEvent('controller_front_init_routers', array('front'=>$this));`

`class Mage_Core_Controller_Varien_Front`

* `Mage::dispatchEvent('controller_front_send_response_before', array('front'=>$this));`
* `Mage::dispatchEvent('controller_front_send_response_after', array('front'=>$this));`

### Follow the flow of control through front controller initialization until an action controller is dispatched.

{% highlight php %}
<?php
class Mage_Core_Model_App
{
 public function run($params)
 {
  $options = isset($params['options']) ? $params['options'] : array();
  $this->baseInit($options);
  Mage::register('application_params', $params);

  if ($this->_cache->processRequest()) {
   $this->getResponse()->sendResponse();
  } else {
   $this->_initModules();
   $this->loadAreaPart(Mage_Core_Model_App_Area::AREA_GLOBAL, Mage_Core_Model_App_Area::PART_EVENTS);

   if ($this->_config->isLocalConfigLoaded()) {
    $scopeCode = isset($params['scope_code']) ? $params['scope_code'] : '';
    $scopeType = isset($params['scope_type']) ? $params['scope_type'] : 'store';
    $this->_initCurrentStore($scopeCode, $scopeType);
    $this->_initRequest();
    Mage_Core_Model_Resource_Setup::applyAllDataUpdates();
   }

   $this->getFrontController()->dispatch();
  }
  return $this;
 }
}
{% endhighlight %}


{% highlight php %}
<?php
class Mage_Core_Model_App
{
 protected $_frontController;

 public function getFrontController()
 {
  if (!$this->_frontController) {
   $this->_initFrontController();
  }

  return $this->_frontController;
 }
}
{% endhighlight %}

{% highlight php %}
<?php
class Mage_Core_Model_App
{
 protected function _initFrontController()
 {
  $this->_frontController = new Mage_Core_Controller_Varien_Front();
  Mage::register('controller', $this->_frontController);
  Varien_Profiler::start('mage::app::init_front_controller');
  $this->_frontController->init();
  Varien_Profiler::stop('mage::app::init_front_controller');
  return $this;
 }
}
{% endhighlight %}


{% highlight php %}
<?php
class Mage_Core_Controller_Varien_Front extends Varien_Object
{
 public function init()
 {
  Mage::dispatchEvent('controller_front_init_before', array('front'=>$this));

  $routersInfo = Mage::app()->getStore()->getConfig(self::XML_STORE_ROUTERS_PATH);

  Varien_Profiler::start('mage::app::init_front_controller::collect_routers');
  foreach ($routersInfo as $routerCode => $routerInfo) {
   if (isset($routerInfo['disabled']) && $routerInfo['disabled']) {
    continue;
   }
   if (isset($routerInfo['class'])) {
    $router = new $routerInfo['class'];
    if (isset($routerInfo['area'])) {
     $router->collectRoutes($routerInfo['area'], $routerCode);
    }
    $this->addRouter($routerCode, $router);
   }
  }
  Varien_Profiler::stop('mage::app::init_front_controller::collect_routers');

  Mage::dispatchEvent('controller_front_init_routers', array('front'=>$this));

  // Add default router at the last
  $default = new Mage_Core_Controller_Varien_Router_Default();
  $this->addRouter('default', $default);

  return $this;
 }
}
{% endhighlight %}

`app/code/core/Mage/Core/etc/config.xml`

{% highlight xml %}
<web>
 <routers>
  <admin>
   <area>admin</area>
   <class>Mage_Core_Controller_Varien_Router_Admin</class>
  </admin>
  <standard>
   <area>frontend</area>
   <class>Mage_Core_Controller_Varien_Router_Standard</class>
  </standard>
 </routers>
</web>
{% endhighlight %}

{% highlight php %}
<?php
class Mage_Core_Controller_Varien_Front extends Varien_Object
{
 public function dispatch()
 {
  $request = $this->getRequest();

  // If pre-configured, check equality of base URL and requested URL
  $this->_checkBaseUrl($request);

  $request->setPathInfo()->setDispatched(false);

  $this->_getRequestRewriteController()->rewrite();

  Varien_Profiler::start('mage::dispatch::routers_match');
  $i = 0;
  while (!$request->isDispatched() && $i++ < 100) {
   foreach ($this->_routers as $router) {
    /** @var $router Mage_Core_Controller_Varien_Router_Abstract */
    if ($router->match($request)) {
     break;
    }
   }
  }
  Varien_Profiler::stop('mage::dispatch::routers_match');
  if ($i>100) {
   Mage::throwException('Front controller reached 100 router match iterations');
  }
  // This event gives possibility to launch something before sending output (allow cookie setting)
  Mage::dispatchEvent('controller_front_send_response_before', array('front'=>$this));
  Varien_Profiler::start('mage::app::dispatch::send_response');
  $this->getResponse()->sendResponse();
  Varien_Profiler::stop('mage::app::dispatch::send_response');
  Mage::dispatchEvent('controller_front_send_response_after', array('front'=>$this));
  return $this;
 }
}
{% endhighlight %}

{% comment %}
Fix "__" breaking color highlighting in atom.
{% endcomment %}

#### Which ways exist in Magento to add router classes?

We find an example of adding a router with `xml` in the module `Mage_Core`. This is where we add the admin and standard router.

{% highlight xml %}
<stores>
 <default>
  <web>
   <routers>
    <admin>
     <area>admin</area>
     <class>Mage_Core_Controller_Varien_Router_Admin</class>
    </admin>
    <standard>
     <area>frontend</area>
     <class>Mage_Core_Controller_Varien_Router_Standard</class>
    </standard>
   </routers>
  </web>
 </default>
</stores>
{% endhighlight %}

If we want to add our own custom route we would do like this. Under routers we add a node with our `module_identifier` (router name). In the `area` node we define if it is a `admin` or `frontend` router. The last node is the `class` node this is where we add the name of the `class` the router is going to use.

{% highlight xml %}
<default>
 <web>
  <routers>
   <[router_identifier]>
    <area>frontend</area>
    <class>Namespace_Module_Controller_Routername</class>
   </[router_identifier]>
  </routers>
 </web>
</default>
{% endhighlight %}

{% highlight php %}
<?php
class Namespace_Module_Controller_Routername extends Mage_Core_Controller_Varien_Router_Standard
{
 public function match(Zend_Controller_Request_Http $request)
 {
  /****/
  return true;
 }
}
{% endhighlight %}

When we create our controller we pick what router it is going to use. In the module `Mage_Sales` a `frontend` `controller` is defined. It uses the `standard` router.

{% highlight xml %}
<frontend>
 <routers>
  <sales>
   <use>standard</use>
   <args>
    <module>Mage_Sales</module>
    <frontName>sales</frontName>
   </args>
  </sales>
 </routers>
</frontend>
{% endhighlight %}

The module `Mage_Adminhtml` adds a `admin` `controller`. This controller uses the `admin` router.

{% highlight xml %}
<admin>
 <routers>
  <adminhtml>
   <use>admin</use>
   <args>
    <module>Mage_Adminhtml</module>
    <frontName>admin</frontName>
   </args>
  </adminhtml>
 </routers>
</admin>
{% endhighlight %}

If we want to use the custom `router` we created earlier we add a `controller`. We created our `router` as a frontend `router`. Therefor we define our controller as a frontend `controller`. The only difference from a `standard` `controller` is in the `use` node where we add our `router identifier` instead of `standard`.

{% highlight xml %}
<frontend>
 <routers>
  <[module_identifier]>
   <use>[router_identifier]</use>
   <args>
    <module>My_Module</module>
    <frontName>myfrontname</frontName>
   </args>
  </[module_identifier]>
 </routers>
</frontend>
{% endhighlight %}

We can also add a router with an `observer`. We find and example of this is `Mage/Cms/config.xml`.

{% highlight xml %}
<global>
 <events>
  <controller_front_init_routers>
   <observers>
    <cms>
     <class>Mage_Cms_Controller_Router</class>
     <method>initControllerRouters</method>
    </cms>
   </observers>
  </controller_front_init_routers>
 </events>
</global>
{% endhighlight %}

{% highlight php %}
<?php
class Mage_Cms_Controller_Router extends Mage_Core_Controller_Varien_Router_Abstract
{
 public function initControllerRouters($observer)
 {
 /* @var $front Mage_Core_Controller_Varien_Front */
 $front = $observer->getEvent()->getFront();

  $front->addRouter('cms', $this);
 }
}
{% endhighlight %}

{% comment %}
Fix "/*" breaking color highlighting in atom.
{% endcomment %}

#### What are the differences between the various ways to add routers?

We can add routers thru `config` or with an `observer`. The difference with adding a router with an `observer` is that it is added later. The `event` `controller_front_init_routers` in [Mage_Core_Controller_Varien_Front::init()][Mage_Core_Controller_Varien_Front::init] is thrown after the `config` is loaded.

{% highlight php %}
<?php
class Mage_Core_Controller_Varien_Front extends Varien_Object
{
 protected $_routers = array();

 public function addRouter($name, Mage_Core_Controller_Varien_Router_Abstract $router)
 {
  $router->setFront($this);
  $this->_routers[$name] = $router;
  return $this;
 }
}
{% endhighlight %}

If we call [Mage_Core_Controller_Varien_Front::addRouter()][Mage_Core_Controller_Varien_Front::addRouter] in our observer we can replace one route with another.

#### Think of possible uses for each of the events fired in the front controller

`class Mage_Core_Controller_Varien_Front`

* `controller_front_init_before`
* `controller_front_init_routers` Can be used to add a router.
* `controller_front_send_response_before` This event gives possibility to launch something before sending output (allow cookie setting)
* `controller_front_send_response_after`

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Core_Controller_Varien_Front::init()][Mage_Core_Controller_Varien_Front::init] and [dispatch()][Mage_Core_Controller_Varien_Front::dispatch]

#### Additional Readings

* [Alan Storm: In Depth Magento Dispatch: Top Level Routers][alanstorm.com-dispatch-routers]
* [Dev Docs: Part 3 — Magento Controller Dispatch][devdocs.mage-for-dev-3]
* [Solving Magento: Magento’s Front Controller][divisionlab.front-controller]





[alanstorm.com-dispatch-routers]:http://alanstorm.com/magento_dispatch_routers/
[devdocs.mage-for-dev-3]:http://devdocs.magento.com/guides/m1x/magefordev/mage-for-dev-3.html
[divisionlab.front-controller]:http://www.divisionlab.com/solvingmagento/magentos-front-controller/




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
