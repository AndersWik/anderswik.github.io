---
layout: post
title:  Magento Developer Certification Basics of Configuration
date:   2016-10-28 22:30:00
categories: Magento
---

Notes about `Magento Developer Certification the Basics of configuration Chapter`.

1 - Basics
====================


Magento configuration
--------------------

### Explain how Magento loads and manipulates configuration information

Magento configuration is the different `xml` files that configures the database connection, enables modules, etc. Magento first get all global `xml` files from the [app/etc/][app/etc/] directory. This is done with the [loadBase()][Mage_Core_Model_Config::loadBase] method in the `class` [Mage_Core_Model_Config][Mage_Core_Model_Config].

{% highlight php %}
`<?php
class Mage_Core_Model_Config extends Mage_Core_Model_Config_Base
{
 public function loadBase()
 {
  $etcDir = $this->getOptions()->getEtcDir();
  $files = glob($etcDir.DS.'*.xml');
  $this->loadFile(current($files));
  while ($file = next($files)) {
   $merge = clone $this->_prototype;
   $merge->loadFile($file);
    $this->extend($merge);
   }
  if (in_array($etcDir.DS.'local.xml', $files)) {
   $this->_isLocalConfigLoaded = true;
  }
  return $this;
 }`
{% endhighlight %}

Then Magento gather all the modules declaration files and all the modules configuration files. This is done with the [Mage_Core_Model_Config::loadModules][Mage_Core_Model_Config::loadModules] `function`. In this method Magento loads all the files in [app/etc/modules/][app/etc/modules/] with a call to [Mage_Core_Model_Config::_loadDeclaredModules][Mage_Core_Model_Config::_loadDeclaredModules]. The files in the [app/etc/modules/][app/etc/modules/] directory are the modules declaration files. These files tells Magento if a module are enabled and what `code pool` the module is located in.

The first declaration file to be loaded from [app/etc/modules/][app/etc/modules/] are [Mage_All.xml][Mage_All.xml] then all other files that starts with `Mage_`. The rest of the modules are loaded in alphabetical order, with the exception for modules that depends on other modules.

* `Mage_All.xml`
* `Mage_*.xml`
* `[A-Z].xml`

The next call in [Mage_Core_Model_Config::loadModules][Mage_Core_Model_Config::loadModules] are to [Mage_Core_Model_Config::_getDeclaredModuleFiles][Mage_Core_Model_Config::_getDeclaredModuleFiles]. This is were Magento loads the modules configuration files. The configuration files are the `config.xml` file in the modules `etc` folder.

* `app/code/{code pool}/{packagename}/{modulename}/etc/config.xml`

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

Then we load the the configuration from the `core_config_data` table. This is done with [Mage_Core_Model_Config::loaddb][Mage_Core_Model_Config::loaddb].

{% highlight php %}
`<?php
class Mage_Core_Model_Config extends Mage_Core_Model_Config_Base
{
 public function loadDb()
 {
  if ($this->_isLocalConfigLoaded && Mage::isInstalled()) {
   Varien_Profiler::start('config/load-db');
   $dbConf = $this->getResourceModel();
   $dbConf->loadToXml($this);
   Varien_Profiler::stop('config/load-db');
  }
  return $this;
 }
}`
{% endhighlight %}

### Describe class group configuration and use in factory methods

`Magento` use `factory methods` to instantiate `blocks`, `helpers`, `models` and `resource models`. When declared in the modules `config.xml` `blocks`, `helpers` and `models` follow the same format.

{% highlight php %}
<global>
 <{type}>
  <{module_identifier}>
   <class>{class prefix}</class>
  </{module_identifier}>
 </{type}>
</global>
{% endhighlight %}

We can use the [Mage_Admin][Mage_Admin] module as an example. In [Mage/Admin/etc/config.xml][Mage/Admin/etc/config.xml] we find all three declarations.

{% highlight xml %}
<global>
 <models>
  <admin>
   <class>Mage_Admin_Model</class>
   <!-- ... -->
  </admin>			
  <!-- ... -->
 </models>
 <helpers>
  <admin>
   <class>Mage_Admin_Helper</class>
  </admin>
 </helpers>
 <blocks>
  <admin>
   <class>Mage_Admin_Block</class>
  </admin>
 </blocks>
</global>
{% endhighlight %}

We are going to walk thru the functions `Magento` use when instantiating these `classes`. We will use [Mage_Sales][Mage_Sales] as an example of how `Magento` finds a `class`. If we look in [Mage/Sales/etc/config.xml][Mage/Sales/etc/config.xml] we find a model node.

{% highlight xml %}
<global>
 <!-- ... --->
 <models>
  <sales>
   <class>Mage_Sales_Model</class>
   <resourceModel>sales_resource</resourceModel>
  </sales>
  <!-- ... --->
 </models>
</global>
{% endhighlight %}

The `class` node is the `class prefix`. In this case the `class prefix` is `Mage_Sales_Model`.

{% highlight php %}
<?php
$order = Mage::getModel('sales/order')->load($orderId);
{% endhighlight %}

We use the factory method [getModel()][Mage::getModel] to get the `class` instance. The [getModel()][Mage::getModel] `function` is located in [app/Mage.php][app/Mage.php]. The arguments to the function is the  `module identifier` and the file name separated with an `/`.

{% highlight php %}
<?php
 public static function getModel($modelClass = '', $arguments = array())
 {
  return self::getConfig()->getModelInstance($modelClass, $arguments);
 }
{% endhighlight %}

The file name can also include the path to the file from the model folder. If we wanted the `class` [Mage_Sales_Model_Order_Address][Mage_Sales_Model_Order_Address] the `Address.php` file is located in a folder called `Order` in the [Mage_Sales_Model][Mage_Sales_Model] folder. We would then use `sales/order_address` instead of `sales/order`. This part after the `/` is called the `object identifier`. The function [getModel()][Mage::getModel] calls [Mage_Core_Model_Config::getModelInstance()][Mage_Core_Model_Config::getModelInstance].

{% highlight php %}
<?php
 public function getModelInstance($modelClass='', $constructArguments=array())
 {
  $className = $this->getModelClassName($modelClass);
  if (class_exists($className)) {
   Varien_Profiler::start('CORE::create_object_of::'.$className);
   $obj = new $className($constructArguments);
   Varien_Profiler::stop('CORE::create_object_of::'.$className);
   return $obj;
   } else {
    return false;
   }
 }
{% endhighlight %}

And the function [getModelInstance()][Mage_Core_Model_Config::getModelInstance] calls [Mage_Core_Model_Config::getModelClassName][Mage_Core_Model_Config::getModelClassName].

{% highlight php %}
<?php
 public function getModelClassName($modelClass)
 {
  $modelClass = trim($modelClass);
  if (strpos($modelClass, '/')===false) {
   return $modelClass;
  }
  return $this->getGroupedClassName('model', $modelClass);
 }
{% endhighlight %}

[getModelClassName()][Mage_Core_Model_Config::getModelClassName] looks at the string and checks if it contains a `/`. If not it `returns` the class name as is. If the string does contain a `/` it passes the string to the [Mage_Core_Model_Config::getGroupedClassName][Mage_Core_Model_Config::getGroupedClassName] `function`. It also adds the `group type` The `$groupType` argument can be `model`, `block` or `helper`. In this case it is `model`.

{% highlight php %}
`<?php
 public function getGroupedClassName($groupType, $classId, $groupRootNode=null)
 {
  if (empty($groupRootNode)) {
   $groupRootNode = 'global/'.$groupType.'s';
  }

  $classArr = explode('/', trim($classId));
  $group = $classArr[0];
  $class = !empty($classArr[1]) ? $classArr[1] : null;

  if (isset($this->_classNameCache[$groupRootNode][$group][$class])) {
   return $this->_classNameCache[$groupRootNode][$group][$class];
  }

  $config = $this->_xml->global->{$groupType.'s'}->{$group};

  // First - check maybe the entity class was rewritten
  $className = null;
  if (isset($config->rewrite->$class)) {
   $className = (string)$config->rewrite->$class;
  } else {
  /**
   * Backwards compatibility for pre-MMDB extensions.
   * In MMDB release resource nodes <..._mysql4> were renamed to <..._resource>. So <deprecatedNode> is left
   * to keep name of previously used nodes, that still may be used by non-updated extensions.
   */
   if (isset($config->deprecatedNode)) {
    $deprecatedNode = $config->deprecatedNode;
    $configOld = $this->_xml->global->{$groupType.'s'}->$deprecatedNode;
    if (isset($configOld->rewrite->$class)) {
     $className = (string) $configOld->rewrite->$class;
    }
   }
  }

  // Second - if entity is not rewritten then use class prefix to form class name
  if (empty($className)) {
   if (!empty($config)) {
    $className = $config->getClassName();
   }
   if (empty($className)) {
    $className = 'mage_'.$group.'_'.$groupType;
   }
   if (!empty($class)) {
    $className .= '_'.$class;
   }
   $className = uc_words($className);
  }

  $this->_classNameCache[$groupRootNode][$group][$class] = $className;
  return $className;
 }`
{% endhighlight %}

The function explodes the string `sales/order` on `/`. It then locates the `sales` node in the `xml` and finds the `class` prefix `Mage_Sales_Model`. In this example the `function` will `return` `Mage_Sales_Model_Order`. This is the `class prefix` and the part after the `/`.

### Describe the process and configuration of class overrides in Magento

There are two ways to override a file. The first way is to copy the file to the same path in the `app/code/local` folder and make our changes there.

* `app/code/core/Mage/Sales/Model/Order.php`
* `app/code/local/Mage/Sales/Model/Order.php`

This works because Magento search for the file in three `codepools` and will return the one first found.

{% highlight php %}
<?php
 $paths = array();
 $paths[] = BP . DS . 'app' . DS . 'code' . DS . 'local';
 $paths[] = BP . DS . 'app' . DS . 'code' . DS . 'community';
 $paths[] = BP . DS . 'app' . DS . 'code' . DS . 'core';
 $paths[] = BP . DS . 'lib';
{% endhighlight %}

Since `local` is the first to be found this file will take precedence over the one in the core `folder`.

The second way is to use a modules `config.xml`. This is possible due to the `factory methods`. We need to add a `rewrite` node under the `type` that we want to rewrite. The syntax looks like this.

{% highlight xml %}
<global>
 <{type}>
  <{module_identifier_of_other_module}>
   <rewrite>
    <{object_identifier_of_other_module}>My_Module_Model_Some_Class</{object_identifier_of_other_module}>
   </rewrite>
  </{module_identifier_of_other_module}>
 </{type}>
</global>
{% endhighlight %}

We use [Mage_Sales][Mage_Sales] as an example again. Say that we have a `module` with the `namespace` "My" and the module name "Module". In this module we have a `class` we want all modules to use instead of `Mage_Sales_Model_order`. This `class` is called `My_Module_Model_Order` and `extends` `Mage_Sales_Model_order`.

{% highlight php %}
<?php
class My_Module_Model_Order extends Mage_Sales_Model_order
{
//code
}
{% endhighlight %}

To override the `class` we add a node under `model` with the same `module identifier` as the module you want to override. We can find what this `module identifier` is in the modules `config.xml`. In this case it is `sales` and we find it in [Mage/Sales/etc/config.xml][Mage/Sales/etc/config.xml]. The node under `rewrite` is the `object identifier`. This is the same as the part after the `/` when instantiating a class using the factory methods.

{% highlight xml %}
<global>
 <models>
  <sales>
   <rewrite>
    <order>My_Module_Model_Order</order>
   </rewrite>
  </sales>
 </models>
</global>
{% endhighlight %}

To override a frontend controller.

{% highlight xml %}
<config>
 <frontend>
  <routers>
   <sales>
    <args>
     <modules>
      <my_module before="Mage_Sales">My_Module</my_module>
     </modules>
    </args>
   </sales>
  </routers>
 </frontend>
</config>
{% endhighlight %}

{% highlight php %}
<?php
require_once 'Mage/Sales/controllers/OrderController.php';

class  My_Module_OrderController extends Mage_Sales_OrderController
{
	...
}
{% endhighlight %}

To override an admin controller

{% highlight xml %}
<config>
 <admin>
  <routers>
   <adminhtml>
    <args>
     <modules>
      <my_module before="Mage_Adminhtml">My_Module</my_module>
     </modules>
    </args>
   </adminhtml>
  </routers>
 </admin>
</config>
{% endhighlight %}

### Register an Observer

To add an event we need to call the [Mage::dispatchEvent()][Mage::dispatchEvent] factory method.

{% highlight php %}
<?php
Mage::dispatchEvent('event_name', $event_arguments);
{% endhighlight %}

[Mage::dispatchEvent()][Mage::dispatchEvent] in turn calls [Mage_Core_Model_App::dispatchEvent()][Mage_Core_Model_App::dispatchEvent]. To listen to a observer we add an event listener in our modules `config.xml`.

{% highlight xml %}
<config>
 <{area}>
  <events>
   <{event_name}>
    <observers>
     <{observer name}>
      <type>{type}</type>
      <class>{class}</class>
      <method>{method}</method>
     </{observer name}>
    </observers>
   </{event_name}>
  </events>
 </{area}>
</config>
{% endhighlight %}

The `function` [Mage_Checkout_Model_Cart::addProduct][Mage_Checkout_Model_Cart::addProduct] dispatch an event after a product is added to the cart. This event is called `checkout_cart_product_add_after`.

{% highlight php %}
<?php
Mage::dispatchEvent('checkout_cart_product_add_after', array('quote_item' => $result, 'product' => $product));
{% endhighlight %}

We make a module that listen for it. First we add a declaration file in `app/etc/modules`. The file name is `My_Module.xml`.

{% highlight xml %}
<?xml version="1.0"?>
<config>
 <modules>
  <My_Module>
   <active>true</active>
   <codePool>community</codePool>
  </My_Module>
 </modules>
</config>
{% endhighlight %}

Then we add a configuration file in `app/code/community/My/Module/etc`.

{% highlight xml %}
<?xml version="1.0"?>
<config>
 <modules>
  <My_Module>
   <version>0.1.0</version>
  </My_Module>
 </modules>
 <global>
  <helpers>
   <mymodule>
    <class>My_Module_Helper</class>
   </mymodule>
  </helpers>
  <models>
   <mymodule>
    <class>My_Module_Model</class>
   </mymodule>
  </models>
  <events>
   <checkout_cart_product_add_after>
    <observers>
     <my_module_cart_observer>
      <type>singleton</type>
      <class>mymodule/observer</class>
      <method>dostuff</method>
     </my_module_cart_observer>
    </observers>
   </checkout_cart_product_add_after>
  </events>
 </global>
</config>
{% endhighlight %}

Then we add a file called `Observer.php` in `app/code/community/My/Module/Model`.

{% highlight php %}
<?php
class My_Module_Model_Observer
{
    public function dostuff(Varien_Event_Observer $obs)
    {
        Mage::log("My_Module_Model_Observer::dostuff");
    }
}
{% endhighlight %}

Now when a product is added to cart "stuff" will happen.

### Identify the function and proper use of automatically available events, including

Magento dispatch several automatic `events`. This enables us to listen after these events and interact with other modules and their data without the need for rewrites. These events are dispatched from [Mage_Core_Model_Abstract][Mage_Core_Model_Abstract].

* `_load_before`
* `_load_after`
* `_save_before`
* `_save_after`
* `_save_commit_afters`
* `_delete_before`
* `_delete_after`
* `_delete_commit_after`

{% highlight php %}
`<?php
abstract class Mage_Core_Model_Abstract extends Varien_Object
{
 protected $_eventPrefix = 'core_abstract';

 protected function _beforeLoad($id, $field = null)
 {
  $params = array('object' => $this, 'field' => $field, 'value'=> $id);
  Mage::dispatchEvent('model_load_before', $params);
  $params = array_merge($params, $this->_getEventData());
  Mage::dispatchEvent($this->_eventPrefix.'_load_before', $params);
  return $this;
 }

 protected function _afterLoad()
 {
  Mage::dispatchEvent('model_load_after', array('object'=>$this));
  Mage::dispatchEvent($this->_eventPrefix.'_load_after', $this->_getEventData());
  return $this;
 }

 protected function _beforeSave()
 {
  if (!$this->getId()) {
   $this->isObjectNew(true);
  }
  Mage::dispatchEvent('model_save_before', array('object'=>$this));
  Mage::dispatchEvent($this->_eventPrefix.'_save_before', $this->_getEventData());
  return $this;
 }

 protected function _afterSave()
 {
  $this->cleanModelCache();
  Mage::dispatchEvent('model_save_after', array('object'=>$this));
  Mage::dispatchEvent($this->_eventPrefix.'_save_after', $this->_getEventData());
  return $this;
 }

 public function afterCommitCallback()
 {
  Mage::dispatchEvent('model_save_commit_after', array('object'=>$this));
  Mage::dispatchEvent($this->_eventPrefix.'_save_commit_after', $this->_getEventData());
  return $this;
 }

 protected function _beforeDelete()
 {
  Mage::dispatchEvent('model_delete_before', array('object'=>$this));
  Mage::dispatchEvent($this->_eventPrefix.'_delete_before', $this->_getEventData());
  $this->cleanModelCache();
  return $this;
 }

 protected function _afterDelete()
 {
  Mage::dispatchEvent('model_delete_after', array('object'=>$this));
  Mage::dispatchEvent($this->_eventPrefix.'_delete_after', $this->_getEventData());
  return $this;
 }

 protected function _afterDeleteCommit()
 {
  Mage::dispatchEvent('model_delete_commit_after', array('object'=>$this));
  Mage::dispatchEvent($this->_eventPrefix.'_delete_commit_after', $this->_getEventData());
  return $this;
 }
}`
{% endhighlight %}

[Mage_Core_Model_Abstract][Mage_Core_Model_Abstract] defines the event prefix `core_abstract`. This means that all events listed above will have have `core_abstract` as a `prefix`. `core_abstract_load_before` `core_abstract_load_after` and so on.

Models that `extends` [Mage_Core_Model_Abstract][Mage_Core_Model_Abstract] can redefine their own event prefixes. The event prefix is an easy way to add several events that are specific to your custom module. An example is [Mage_Sales_Model_Order][Mage_Sales_Model_Order]. This `class` change the event prefix to `sales_order`. This gives us all the events with the new prefix.

* `sales_order_load_before`
* `sales_order_load_after`
* `sales_order_save_before`
* `sales_order_save_after`
* `sales_order_save_commit_afters`
* `sales_order_delete_before`
* `sales_order_delete_after`
* `sales_order_delete_commit_after`

### Set up a cron job

{% highlight xml %}
<config>
 <crontab>
  <jobs>
   <{cron identifier}>
    <schedule>
     <cron_expr>{cron_expression}</cron_expr>
    </schedule>
    <run>
     <model>{grouped_class_name::method_name}</model>
    </run>
   </{cron identifier}>
  </jobs>
 </crontab>
</config>
{% endhighlight %}

To use cron we create a module. We add a declaration file in `app/etc/modules`. The file name is `My_Module.xml`.

{% highlight xml %}
<?xml version="1.0"?>
<config>
 <modules>
  <My_Module>
   <active>true</active>
   <codePool>community</codePool>
  </My_Module>
 </modules>
</config>
{% endhighlight %}

Then we add a configuration file in `app/code/community/My/Module/etc`.

{% highlight xml %}
`<?xml version="1.0"?>
<config>
 <modules>
  <My_Module>
   <version>0.1.0</version>
  </My_Module>
 </modules>
 <global>
  <helpers>
   <mymodule>
    <class>My_Module_Helper</class>
   </mymodule>
  </helpers>
  <models>
   <mymodule>
    <class>My_Module_Model</class>
   </mymodule>
  </models>
 </global>
 <crontab>
  <jobs>
   <mymodule_do_stuff>
    <schedule>
     <cron_expr>0 0 * * *</cron_expr>
    </schedule>
    <run>
     <model>mymodule/observer::docronstuff</model>
    </run>
   </mymodule_do_stuff>
  </jobs>
 </crontab>
</config>`
{% endhighlight %}

Then we add a file called `Observer.php` in `app/code/community/My/Module/Model`.

{% highlight php %}
<?php
class My_Module_Model_Observer
{
 public function docronstuff()
 {
  Mage::log("My_Module_Model_Observer::docronstuff");
 }
}
{% endhighlight %}


[Mage/Cron/Model/Schedule.php][Mage/Cron/Model/Schedule.php]

{% highlight php %}
<?php
class Mage_Cron_Model_Schedule extends Mage_Core_Model_Abstract
{
  const STATUS_PENDING = 'pending';
  const STATUS_RUNNING = 'running';
  const STATUS_SUCCESS = 'success';
  const STATUS_MISSED = 'missed';
  const STATUS_ERROR = 'error';
}
{% endhighlight %}

`cron_schedule`

#### How does the framework discover active modules and their configuration?

Magento gather all the modules declaration files and all the modules configuration files with the [Mage_Core_Model_Config::loadModules][Mage_Core_Model_Config::loadModules] `function`. Magento loads all the files in [app/etc/modules/][app/etc/modules/] with a call to [Mage_Core_Model_Config::_loadDeclaredModules][Mage_Core_Model_Config::_loadDeclaredModules]. The files in the [app/etc/modules/][app/etc/modules/] directory are the modules declaration files. These files tell Magento if a module are enabled and what `code pool` the module is located in.

The next call in [Mage_Core_Model_Config::loadModules][Mage_Core_Model_Config::loadModules] are to [Mage_Core_Model_Config::_getDeclaredModuleFiles][Mage_Core_Model_Config::_getDeclaredModuleFiles]. This is were Magento loads the modules configuration files. The configuration files are the `config.xml` file in the modules `etc` folder.

#### What are the common methods with which the framework accesses its configuration values and areas?

* `Mage::getStoreConfig($path, $store = null);`
* `Mage::app()->getStore()->getConfig($path);`
* `Mage::getStoreConfigFlag($path, $store = null);`
* `Mage::getConfig()->getNode($path);`

#### How are per-store configuration values established in the XML DOM?

This is done in the module etc/config.xml. An example is [Mage/Adminhtml/etc/config.xml][Mage/Adminhtml/etc/config.xml].

{% highlight xml %}
<stores>
 <admin>
  <design>
   <package>
    <name>default</name>
   </package>
   <theme>
    <default>default</default>
   </theme>
  </design>
 </admin>
</stores>
{% endhighlight %}

{% highlight xml %}
<websites>
 <admin>
  <web>
   <routers>
    <frontend>
     <disabled>true</disabled>
    </frontend>
   </routers>
   <default>
    <no_route>admin/index/noRoute</no_route>
   </default>
  </web>
 </admin>
</websites>
{% endhighlight %}

#### By what process do the factory methods and autoloader enable class instantiation?

* [Varien_Autoload][Varien_Autoload]
* [spl_autoload_register][spl_autoload_register]

* [Mage::getModel()][Mage::getModel]
* [Mage::getSingleton()][Mage::getSingleton]
* [Mage::getResourceModel()][Mage::getResourceModel]
* [Mage::getResourceSingleton()][Mage::getResourceSingleton]
* [Mage::getBlockSingleton()][Mage::getBlockSingleton]
* [Mage::helper()][Mage::helper]
* [Mage::getResourceHelper()][Mage::getResourceHelper]

#### Which class types have configured prefixes, and how does this relate to and how does this relate to class overrides?

* `Helpers`
* `Models`
* `Resource Models`
* `Blocks`

A `class` type with configured prefix can be overriden in a modules `config.xml`. This is possible due to the factory methods. We need to add a rewrite node under the type that we want to rewrite. The syntax looks like this.

{% highlight xml %}
<global>
 <{type}>
  <{module_identifier_of_other_module}>
   <rewrite>
    <{object_identifier_of_other_module}>My_Module_Model_Some_Class</{object_identifier_of_other_module}>
   </rewrite>
  </{module_identifier_of_other_module}>
 </{type}>
</global>
{% endhighlight %}

{% highlight xml %}
<global>
 <models>
  <sales>
   <rewrite>
    <order>My_Module_Model_Order</order>
   </rewrite>
  </sales>
 </models>
</global>
{% endhighlight %}

You can also rewrite a file by adding the same file path in the `app/etc/local` folder.

#### Which class types and files have explicit paths?

#### What configuration parameters are available for event observers?

{% highlight xml %}
<config>
 <{area}>
  <events>
   <{event name}>
    <observers>
     <{observer name}>
      <type>{type}</type>
      <class>{class}</class>
      <method>{method}</method>
     </{observer name}>
    </observers>
   </{event name}>
  </events>
 </{area}>
</config>
{% endhighlight %}

* Area
  * `frontend`
  * `adminhtml`
  * `global`
* Event name
  * The name of the event that the observer are listening for.
* Observer name
  * A unique identifier.
* Type
  * `model`
  * `object`
  * `none`
  * `singleton`
  * `disabled`
* Class
  * `class` that the observer calls.
* Method
  * A function that exist in the `class` defined under the `class` node.

#### What are the interface and configuration options for automatically fired events?

{% highlight php %}
`<?php
abstract class My_Module_Model_File extends Mage_Core_Model_Abstract
{
 protected $_eventPrefix = 'module_file';
}`
{% endhighlight %}

When creating a model for our module we can add the `$_eventPrefix` variable.

The there will be automatically fired events with that name.

* `$_eventPrefix`+`_load_before` (`module_file_load_before`)
* `$_eventPrefix`+`_load_after` (`module_file_load_after`)
* `$_eventPrefix`+`_save_before` (`module_file_save_before`)
* `$_eventPrefix`+`_save_after` (`module_file_save_after`)
* `$_eventPrefix`+`_save_commit_afters` (`module_file_save_commit_afters`)
* `$_eventPrefix`+`_delete_before` (`module_file_delete_before`)
* `$_eventPrefix`+`_delete_after` (`module_file_delete_after`)
* `$_eventPrefix`+`_delete_commit_after` (`module_file_delete_commit_after`)


#### What is the structure of event observers, and how are properties accessed therein?

{% highlight php %}
<?php
Mage::dispatchEvent('event_name', $event_arguments);
{% endhighlight %}

[app/Mage.php][app/Mage.php]

{% highlight php %}
`<?php
public static function dispatchEvent($name, array $data = array())
{
 Varien_Profiler::start('DISPATCH EVENT:'.$name);
 $result = self::app()->dispatchEvent($name, $data);
 Varien_Profiler::stop('DISPATCH EVENT:'.$name);
 return $result;
}`
{% endhighlight %}

{% highlight xml %}
<config>
 <{area}>
  <events>
   <{event name}>
    <observers>
     <{observer name}>
      <type>{type}</type>
      <class>{class}</class>
      <method>{method}</method>
     </{observer name}>
    </observers>
   </{event name}>
  </events>
 </{area}>
</config>
{% endhighlight %}

{% highlight php %}
<?php
public function someObserverMethod($observer)
{
  $order = $observer->getEvent()->getOrder();
  /****/
}
{% endhighlight %}

#### What configuration parameters are available for cron jobs?

{% highlight xml %}
<config>
 <crontab>
  <jobs>
   <{cron identifier}>
    <schedule>
     <cron_expr>{cron_expression}</cron_expr>
    </schedule>
    <run>
     <model>{grouped_class_name}::{method_name}</model>
    </run>
   </{cron identifier}>
  </jobs>
 </crontab>
</config>
{% endhighlight %}

There are two parameters. The `<cron_expr>` node is the first. This is where we set the interval. The second one is the `<model>` node. This is where we define what `function` is going to run.

#### These code references can be used as an entry point to find answers to the questions above:

* `Mage_Core_Model_App_Area`
* `Mage_Core_Model_Config`
* `Mage_Core_Model_Store`
* `Varien_Event_Observer`

#### Additional Readings

* [Alan Storm: Magento Configuration: Loading Declared Modules][alanstorm.magento_config_declared_modules]
* [Belvg: Setting Up a Cron Job][belvg-cron]
* [Magecert.com: Basics][magecert.basics]
* [Nathan McBride: Magento-Configuration][brideo.magento-Configuration]
* [Solvingmagento: magento routers a look under the hood][divisionlab.magento-routers]



[belvg-cron]:http://blog.belvg.com/magento-certified-developer-exam-setting-up-a-cron-job.html
[brideo.magento-Configuration]:http://brideo.co.uk/magento-certification-notes/basics/Magento-Configuration/
[magecert.basics]:http://magecert.com/basics.html
[alanstorm.magento_config_declared_modules]:http://alanstorm.com/magento_config_declared_modules_tutorial/



[alanstorm.magento_infinite_fallback]:http://alanstorm.com/magento_infinite_fallback_theme_xml/
[magecert-conflict-resolution]:http://magecert.com/basics.html#conflict-resolution
[belvg-resolving-module-conflicts]:http://blog.belvg.com/get-ready-for-magento-certified-developer-exam-describing-methods-for-resolving-module-conflicts.html
[devdocs.rwd]:http://devdocs.magento.com/guides/m1x/ce19-ee114/RWD_dev-guide.html
[devdocs.mage-for-dev]:http://devdocs.magento.com/guides/m1x/magefordev/mage-for-dev-1.html
[divisionlab.magento-routers]:http://www.divisionlab.com/solvingmagento/magento-routers-a-look-under-the-hood/
[phpautoload]:http://php.net/manual/en/function.spl-autoload-register.php
[spl_autoload_register]:http://php.net/manual/en/function.spl-autoload-register.php


[app/etc/]:https://github.com/AndersWik/Magento-1x/tree/master/app/etc
[app/etc/modules/]:https://github.com/AndersWik/Magento-1x/tree/master/app/etc/modules
[app/Mage.php]:https://github.com/AndersWik/Magento-1x/blob/master/app/Mage.php
[index.php]:https://github.com/AndersWik/Magento-1x/blob/master/index.php
[Mage::dispatchEvent]:https://github.com/AndersWik/Magento-1x/blob/master/app/Mage.php#L445
[Mage::getModel]:https://github.com/AndersWik/Magento-1x/blob/master/app/Mage.php#L461
[Mage::getSingleton]:https://github.com/AndersWik/Magento-1x/blob/master/app/Mage.php#L473
[Mage::getResourceModel]:https://github.com/AndersWik/Magento-1x/blob/master/app/Mage.php#L489
[Mage::getResourceSingleton]:https://github.com/AndersWik/Magento-1x/blob/master/app/Mage.php#L515
[Mage::getBlockSingleton]:https://github.com/AndersWik/Magento-1x/blob/master/app/Mage.php#L530
[Mage::helper]:https://github.com/AndersWik/Magento-1x/blob/master/app/Mage.php#L542
[Mage::getResourceHelper]:https://github.com/AndersWik/Magento-1x/blob/master/app/Mage.php#L558
[Mage_All.xml]:https://github.com/AndersWik/Magento-1x/blob/master/app/etc/modules/Mage_All.xml
[Mage_Admin]:https://github.com/AndersWik/Magento-1x/tree/master/app/code/core/Mage/Admin
[Mage/Admin/etc/config.xml]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Admin/etc/config.xml
[Mage/Adminhtml/etc/config.xml]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Adminhtml/etc/config.xml
[Mage_Checkout_Model_Cart::addProduct]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Checkout/Model/Cart.php#L242
[Mage/Core/Controller/Varien/Action.php]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Controller/Varien/Action.php
[Mage/Core/Model/Abstract.php]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Abstract.php
[Mage_Core_Model_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Abstract.php
[Mage/Core/Model/App.php]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php
[Mage_Core_Model_App::dispatchEvent]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php#L1290
[Mage/Core/Model/Config.php]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Config.php
[Mage_Core_Model_Config]:[Mage/Core/Model/Config.php]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Config.php
[Mage_Core_Model_Config::_loadDeclaredModules]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Config.php#L776
[Mage_Core_Model_Config::_getDeclaredModuleFiles]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Config.php#L701
[Mage_Core_Model_Config::getModelInstance]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Config.php#L1352
[Mage_Core_Model_Config::getModelClassName]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Config.php#L1331
[Mage_Core_Model_Config::getGroupedClassName]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Config.php#L1222
[Mage_Core_Model_Config::loadBase]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Config.php#L273
[Mage_Core_Model_Config::loaddb]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Config.php#L352
[Mage_Core_Model_Config::loadModules]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Config.php#L315
[Mage_Core_Model_Config::loadModulesConfiguration]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Config.php#L938
[Mage_Core_Model_Config::_sortModuleDepends]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Config.php#L844
[Mage/Cron/Model/Schedule.php]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Cron/Model/Schedule.php
[Mage_Sales]:https://github.com/AndersWik/Magento-1x/tree/master/app/code/core/Mage/Sales
[Mage_Sales_Model]:https://github.com/AndersWik/Magento-1x/tree/master/app/code/core/Mage/Sales/Model
[Mage_Sales_Model_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Sales/Model/Abstract.php
[Mage_Sales_Model_Order]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Sales/Model/Order.php
[Mage/Sales/etc/config.xml]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Sales/etc/config.xml
[Mage_Sales_Model_Order_Address]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Sales/Model/Order/Address.php
[Varien_Autoload]:https://github.com/AndersWik/Magento-1x/blob/master/lib/Varien/Autoload.php
