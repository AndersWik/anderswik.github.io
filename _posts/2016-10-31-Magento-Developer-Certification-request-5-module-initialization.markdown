---
layout: post
title:  Magento Developer Certification Request Flow and Module initialization
date:   2016-11-06 18:00:00
categories: Magento
---

Notes about `Magento Developer Certification the Request Flow and Module initialization`.

2 - Request Flow
====================

Module initialization
--------------------


### Describe the steps needed to create and register a new module

To register a module we must add an `xml` file in the `app/etc/modules/` folder. the file name is the `namespace` of the module and the module name separated with a underscore (`namespace_modulename.xml`).

{% highlight xml %}
<?xml version="1.0" ?>
<config>
 <modules>
  <[Namespace]_[Modulename]>
   <active>true</active>
   <codePool>community</codePool>
   </[Namespace]_[Modulename]>
 </modules>
</config>
{% endhighlight %}

The file define the module `namespace` and name. The file also define what `codepool` the module belongs to. We can also use this config file to enable or disable the module. We can do this by changing the `active` node to `true` or `false`. Depending on what codePool that is defined in the config file we place the extension in the `app/code/local` or `app/code/community` folder.

In the `local/community` folder we add a folder with the same name as the modules `namespace`. In the `namespace` folder there will be a subdirectory with the modules name. This is where the modules files are located.

* `Block`
* `controllers`
* `etc`
* `Helper`
* `Model`
* `sql`

To register a module we only need one file in the module folder. That is the `config.xml` file in the etc directory. This is the configuration file for the module.

### Describe the effect of module dependencies

When modules are loaded the first module to be loaded are `Mage_All`. Then all other modules with the `namespace` mage `Mage_*` in alphabetical order. All other modules are loaded after in alphabetical order. With the exception of modules that depends on another module. If a module depends on another module it will be loaded after the module it depends on. If a module that another module depends on is disabled an exception will be thrown.

### Describe different types of configuration files and the priorities of their loading

#### This objective covers how Magento loads modules and how modules interact with each other.

#### What does "Magento loads modules" mean?

#### In which order are Magento modules loaded?

The module `Mage_All` are loaded first. Then all other modules with the namespace mage `Mage_*` in alphabetical order. Then all other modules are loaded in alphabetical order. With the exception of modules that depends on another module. If a module depends on another module it will be loaded after the module it depends on.

#### Which core class loads modules?

Magento use [Mage_Core_Model_Config][Mage_Core_Model_Config] to get all `.xml` files from `app/etc/modules`.

* `Mage_All.xml`
* `Mage_*.xml`
* `[A-Z].xml`

{% highlight php %}
`<?php
class Mage_Core_Model_Config extends Mage_Core_Model_Config_Base
{
 public function loadModules()
 {
  Varien_Profiler::start('config/load-modules');
  $this->_loadDeclaredModules();

  $resourceConfig = sprintf('config.s.xml', $this->_getResourceConnectionModel('core'));
  $this->loadModulesConfiguration(array('config.xml',$resourceConfig), $this);

  /**
   * Prevent local.xml directives overwriting
   */
   $mergeConfig = clone $this->_prototype;
   $this->_isLocalConfigLoaded = $mergeConfig->loadFile($this->getOptions()->getEtcDir().DS.'local.xml');
   if ($this->_isLocalConfigLoaded) {
    $this->extend($mergeConfig);
   }

   $this->applyExtends();
   Varien_Profiler::stop('config/load-modules');
   return $this;
 }`
{% endhighlight %}

#### What are the consequences of one module depending on another module?

If one module depends on another module the module it depends on must be enabled or Magento will throw an error.

#### During the initialization of Magento, when are modules loaded in?

* [index.php][index.php]
* [Mage::run()][Mage::run]
* [Mage_Core_Model_App::run()][Mage_Core_Model_App::run]
* [Mage_Core_Model_App::_initModules()][Mage_Core_Model_App::_initModules]
* [Mage_Core_Model_Config::loadModules()][Mage_Core_Model_Config::loadModules]

#### Why is the load order important?

If two modules set the same config values the module last loaded will take precedence. This can be used to solve conflicts when two modules rewrite the same class.

#### What is the difference regarding module loading between Mage::run() and Mage::app()?

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage::run()][Mage::run] and [Mage::app()][Mage::app]
* [Mage_Core_Model_App::run()][Mage_Core_Model_App::run] and [init()][Mage_Core_Model_App::init]




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
