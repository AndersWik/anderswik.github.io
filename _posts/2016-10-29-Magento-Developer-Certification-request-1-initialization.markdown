---
layout: post
title:  Magento Developer Certification Request Flow and Application initialization
date:   2016-10-29 22:30:00
categories: Magento
---

Notes about `Magento Developer Certification the Basics of architecture Chapter`.

1 - Request Flow
====================

Application initialization
--------------------

### Describe the steps for application initialization

[index.php][index.php]

Includes [app/Mage.php][app/Mage.php]

{% highlight php %}
<?php
Mage::run($mageRunCode, $mageRunType);
{% endhighlight %}

[app/Mage.php][app/Mage.php]

{% highlight php %}
`<?php
final class Mage
{
 define('DS', DIRECTORY_SEPARATOR);
 define('PS', PATH_SEPARATOR);
 define('BP', dirname(dirname(__FILE__)));

 Mage::register('original_include_path', get_include_path());

 if (defined('COMPILER_INCLUDE_PATH')) {
  $appPath = COMPILER_INCLUDE_PATH;
  set_include_path($appPath . PS . Mage::registry('original_include_path'));
  include_once COMPILER_INCLUDE_PATH . DS . "Mage_Core_functions.php";
  include_once COMPILER_INCLUDE_PATH . DS . "Varien_Autoload.php";
 } else {
  /**
   * Set include path
   */
  $paths = array();
  $paths[] = BP . DS . 'app' . DS . 'code' . DS . 'local';
  $paths[] = BP . DS . 'app' . DS . 'code' . DS . 'community';
  $paths[] = BP . DS . 'app' . DS . 'code' . DS . 'core';
  $paths[] = BP . DS . 'lib';

  $appPath = implode(PS, $paths);
  set_include_path($appPath . PS . Mage::registry('original_include_path'));
  include_once "Mage/Core/functions.php";
  include_once "Varien/Autoload.php";
 }

 Varien_Autoload::register();

 public static function run($code = '', $type = 'store', $options = array())
 {
  try {
   Varien_Profiler::start('mage');
   self::setRoot();
   if (isset($options['edition'])) {
    self::$_currentEdition = $options['edition'];
   }
   self::$_app    = new Mage_Core_Model_App();
   if (isset($options['request'])) {
    self::$_app->setRequest($options['request']);
   }
   if (isset($options['response'])) {
    self::$_app->setResponse($options['response']);
   }
   self::$_events = new Varien_Event_Collection();
   self::_setIsInstalled($options);
   self::_setConfigModel($options);
   self::$_app->run(array(
    'scope_code' => $code,
    'scope_type' => $type,
    'options'    => $options,
   ));
   Varien_Profiler::stop('mage');
  } catch (Mage_Core_Model_Session_Exception $e) {
   header('Location: ' . self::getBaseUrl());
   die();
  } catch (Mage_Core_Model_Store_Exception $e) {
   require_once(self::getBaseDir() . DS . 'errors' . DS . '404.php');
   die();
  } catch (Exception $e) {
   if (self::isInstalled() || self::$_isDownloader) {
    self::printException($e);
    exit();
  }
  try {
   self::dispatchEvent('mage_run_exception', array('exception' => $e));
    if (!headers_sent() && self::isInstalled()) {
     header('Location:' . self::getUrl('install'));
    } else {
     self::printException($e);
    }
   } catch (Exception $ne) {
    self::printException($ne, $e->getMessage());
   }
  }
 }
}`
{% endhighlight %}

First we include paths.

{% highlight php %}
<?php
$paths = array();
$paths[] = BP . DS . 'app' . DS . 'code' . DS . 'local';
$paths[] = BP . DS . 'app' . DS . 'code' . DS . 'community';
$paths[] = BP . DS . 'app' . DS . 'code' . DS . 'core';
$paths[] = BP . DS . 'lib';
{% endhighlight %}

Then we include and register the `autoloader`.

{% highlight php %}
<?php
Varien_Autoload::register();
{% endhighlight %}

Then we call [run][Mage_Core_Model_App::run] `function` in [Mage_Core_Model_App][Mage_Core_Model_App].

{% highlight php %}
`<?php
self::$_app->run(array(
    'scope_code' => $code,
    'scope_type' => $type,
    'options'    => $options,
   ));`
{% endhighlight %}

[Mage_Core_Model_App][Mage_Core_Model_App]

{% highlight php %}
`<?php
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
}`
{% endhighlight %}

In [Mage_Core_Model_App->run($params)][Mage_Core_Model_App::run] we call `baseInit`.

{% highlight php %}
`<?php
class Mage_Core_Model_App
{
 public function baseInit($options)
 {
  $this->_initEnvironment();

  $this->_config = Mage::getConfig();
  $this->_config->setOptions($options);

  $this->_initBaseConfig();
  $cacheInitOptions = is_array($options) && array_key_exists('cache', $options) ? $options['cache'] : array();
  $this->_initCache($cacheInitOptions);

  return $this;
 }
}`
{% endhighlight %}


`baseInit` calls `$this->_initBaseConfig` and `_initBaseConfig` calls `loadBase` in [Mage_Core_Model_Config][Mage_Core_Model_Config]. This is where Magento get all xml files in `app/etc`.

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
 }
}`
{% endhighlight %}

After that the `run` `function` in [Mage_Core_Model_App][Mage_Core_Model_App] calls `_initModules` and loads all the `xml` files in the [app/etc/modules/][app/etc/modules/] directory.

{% highlight php %}
`<?php
class Mage_Core_Model_App
{
 protected function _initModules()
 {
  if (!$this->_config->loadModulesCache()) {
   $this->_config->loadModules();
   if ($this->_config->isLocalConfigLoaded() && !$this->_shouldSkipProcessModulesUpdates()) {
    Varien_Profiler::start('mage::app::init::apply_db_schema_updates');
    Mage_Core_Model_Resource_Setup::applyAllUpdates();
    Varien_Profiler::stop('mage::app::init::apply_db_schema_updates');
   }
    $this->_config->loadDb();
    $this->_config->saveCache();
  }
  return $this;
 }
}`
{% endhighlight %}

{% highlight php %}
`<?php
class Mage_Core_Model_Config extends Mage_Core_Model_Config_Base
{
 public function loadModules()
 {
  Varien_Profiler::start('config/load-modules');
  $this->_loadDeclaredModules();

  $resourceConfig = sprintf('config.%s.xml', $this->_getResourceConnectionModel('core'));
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
 }
}`
{% endhighlight %}


{% highlight php %}
`<?php
class Mage_Core_Model_App
{
 protected function _initCurrentStore($scopeCode, $scopeType)
 {
  Varien_Profiler::start('mage::app::init::stores');
  $this->_initStores();
  Varien_Profiler::stop('mage::app::init::stores');

  if (empty($scopeCode) && !is_null($this->_website)) {
   $scopeCode = $this->_website->getCode();
   $scopeType = 'website';
  }
  switch ($scopeType) {
   case 'store':
    $this->_currentStore = $scopeCode;
    break;
   case 'group':
    $this->_currentStore = $this->_getStoreByGroup($scopeCode);
    break;
   case 'website':
    $this->_currentStore = $this->_getStoreByWebsite($scopeCode);
    break;
   default:
    $this->throwStoreException();
  }

  if (!empty($this->_currentStore)) {
   $this->_checkCookieStore($scopeType);
   $this->_checkGetStore($scopeType);
  }
  $this->_useSessionInUrl = $this->getStore()->getConfig(
  Mage_Core_Model_Session_Abstract::XML_PATH_USE_FRONTEND_SID);
  return $this;
 }
}`
{% endhighlight %}

Then `$this->getFrontController()->dispatch()` dispatches the front controller.

### Describe the role of the system entrypoint, index.php

The `index.php` file is the systems main entry point.

First it checks what php version is used. If the `php` version is to low `Magento` will display an error and `exit`.

Then it checks if [includes/config.php][includes/config.php] exists and includes it. The [config.php][includes/config.php] file is for `Magentos` compilation process. It looks like below.

{% highlight xml %}
#define('COMPILER_INCLUDE_PATH', dirname(__FILE__).DIRECTORY_SEPARATOR.'src');
#define('COMPILER_COLLECT_PATH', dirname(__FILE__).DIRECTORY_SEPARATOR.'stat');
{% endhighlight %}

Then it checks if [app/Mage.php][app/Mage.php] exists. If it don't we go to the downloader. Next we see if `Magento` is in `maintenance mode`. We can put `Magento` in `maintenance mode` if we add a file called `maintenance.flag` in the root directory.

Now we set the what store we are going to use. This is done with `$mageRunCode` and `$mageRunType`. If no `website` or `store` is set `Magento` will use the `default`  (`base`) store.

{% highlight php %}
`<?php
/* Store or website code */
$mageRunCode = isset($_SERVER['MAGE_RUN_CODE']) ? $_SERVER['MAGE_RUN_CODE'] : '';

/* Run store or run website */
$mageRunType = isset($_SERVER['MAGE_RUN_TYPE']) ? $_SERVER['MAGE_RUN_TYPE'] : 'store';

Mage::run($mageRunCode, $mageRunType);`
{% endhighlight %}

If we have a multistore site we can use a switch to change store depending on what domain is used.

{% highlight php %}
`<?php
switch($_SERVER['HTTP_HOST']) {
  case 'example.com'
    $mageRunCode = 'example_com';
    $mageRunType = 'example_com';
    break;
  case 'example.org'
    $mageRunCode = 'example_org';
    $mageRunType = 'example_org';
}`
{% endhighlight %}

### Starting with the index.php, including Mage.php, follow through the steps Magento takes to set up the run time environment.

* `include` `/includes/config.php`
* `require_once` `/app/Mage.php`
* `Mage::run($mageRunCode, $mageRunType);`
* Set include path (`local`, `community`, `core`, `lib`)
* `class Mage` > `function run($code = '', $type = 'store', $options = array())`
  * `Mage_Core_Model_App` > `run($params)`
    * `baseInit($options)`
    * `if` cached `sendResponse()`
    * `_initModules()`
    * `loadAreaPart` (`frontend`, `admin`, `install`)
    * Set current store (`$scopeCode` & `$scopeType`)
    * `getFrontController()->dispatch()`

#### How and when is the include path set up and the auto loader registered?

The `include` `path` is set in [index.php][index.php] on `require_once $mageFilename` ([app/Mage.php][app/Mage.php]).

{% highlight php %}
<?php
$paths = array();
$paths[] = BP . DS . 'app' . DS . 'code' . DS . 'local';
$paths[] = BP . DS . 'app' . DS . 'code' . DS . 'community';
$paths[] = BP . DS . 'app' . DS . 'code' . DS . 'core';
$paths[] = BP . DS . 'lib';

$appPath = implode(PS, $paths);
set_include_path($appPath . PS . Mage::registry('original_include_path'));
include_once "Mage/Core/functions.php";
include_once "Varien/Autoload.php";
}
{% endhighlight %}

Then [app/Mage.php][app/Mage.php] will include the `autoloader` (`include_once "Varien/Autoload.php"`) and then call [Varien_Autoload::register()][Varien_Autoload::register].

#### How and when does Magento load the base configuration, the module configuration, and the database configuration?

* [index.php][index.php] > `Mage::run($mageRunCode, $mageRunType)`
* `class` [Mage][app/Mage.php] > `run($code = '', $type = 'store', $options = array())`

Loading the base configuration.

* `class` [Mage_Core_Model_App][Mage_Core_Model_App] > [run($params)][Mage_Core_Model_App::run]
* `class` [Mage_Core_Model_App][Mage_Core_Model_App] > [baseInit($options)][Mage_Core_Model_App::baseInit]
* `class` [Mage_Core_Model_App][Mage_Core_Model_App] > [_initBaseConfig()][Mage_Core_Model_App::_initBaseConfig]
* `class` [Mage_Core_Model_Config][Mage_Core_Model_Config] > [loadBase()][Mage_Core_Model_Config::loadBase]
  * (loads all xml files in [app/etc/][app/etc/])

Loading the module configuration.

* `class` [Mage_Core_Model_App][Mage_Core_Model_App] > [run($params)][Mage_Core_Model_App::run]
* `class` [Mage_Core_Model_App][Mage_Core_Model_App] > [_initModules()][Mage_Core_Model_App::_initModules]
* `class` [Mage_Core_Model_Config][Mage_Core_Model_Config] > [loadModules()][Mage_Core_Model_Config::loadBase]
* `class` [Mage_Core_Model_Config][Mage_Core_Model_Config] > [_loadDeclaredModules()][Mage_Core_Model_Config::_loadDeclaredModules]
* `class` [Mage_Core_Model_Config][Mage_Core_Model_Config] > [_getDeclaredModuleFiles()][Mage_Core_Model_Config::_getDeclaredModuleFiles]
  * (loads all xml files in [app/etc/modules/][app/etc/modules/])
  * loads [Mage_All][Mage_All]
  * then loads all modules that starts with `Mage_`
  * Then all modules sorted on `A-Z` and what modules they depend on.

Loading the database configuration.

* `class` [Mage_Core_Model_App][Mage_Core_Model_App] > [_initModules()][Mage_Core_Model_App::_initModules]
* `class` [Mage_Core_Model_Config][Mage_Core_Model_Config] > [loadDb()][Mage_Core_Model_Config::loadDb]

#### How and when are the two main types of setup script executed?

Resource Scripts

* `class` [Mage_Core_Model_App][Mage_Core_Model_App] > [_initModules()][Mage_Core_Model_App::_initModules]
  * `class` [Mage_Core_Model_Resource_Setup][Mage_Core_Model_Resource_Setup] > [applyAllUpdates()][Mage_Core_Model_Resource_Setup::applyAllUpdates]

Data Scripts

* `class` [Mage_Core_Model_App][Mage_Core_Model_App] > [run($params)][Mage_Core_Model_App::run]
  * `class` [Mage_Core_Model_Resource_Setup][Mage_Core_Model_Resource_Setup] > [applyAllDataUpdates()][Mage_Core_Model_Resource_Setup::applyAllDataUpdates]

#### When does Magento decide which store view to use, and when is the current locale set?

Magento set the current store in the [index.php][index.php] file.

{% highlight php %}
`<?php
/* Store or website code */
$mageRunCode = isset($_SERVER['MAGE_RUN_CODE']) ? $_SERVER['MAGE_RUN_CODE'] : '';

/* Run store or run website */
$mageRunType = isset($_SERVER['MAGE_RUN_TYPE']) ? $_SERVER['MAGE_RUN_TYPE'] : 'store';

Mage::run($mageRunCode, $mageRunType);`
{% endhighlight %}

* `class Mage` > [run($code = '', $type = 'store', $options = array())][Mage::run]
* `class` [Mage_Core_Model_App][Mage_Core_Model_App] > [run($params)][Mage_Core_Model_App::run]
* `class` [Mage_Core_Model_App][Mage_Core_Model_App] > [_initCurrentStore($scopeCode, $scopeType)][Mage_Core_Model_App::_initCurrentStore]:

#### Which ways exist in Magento to specify the current store view?

{% highlight php %}
`<?php
switch($_SERVER['HTTP_HOST']) {
  case 'example.com'
    $mageRunCode = 'example_com';
    $mageRunType = 'example_com';
    break;
  case 'example.org'
    $mageRunCode = 'example_org';
    $mageRunType = 'example_org';
}`
{% endhighlight %}

Or by setting the variables in the `.htaccess` file.

{% highlight php %}
SetEnvIf Host .*example.* MAGE_RUN_CODE=example_com
SetEnvIf Host .*example.* MAGE_RUN_TYPE=example_com
{% endhighlight %}

#### When are the request and response objects initialized?

* `class` [Mage][app/Mage.php] > [run($code = '', $type = 'store', $options = array())][Mage::run]
* `class` [Mage_Core_Model_App][Mage_Core_Model_App] > [run($params)][Mage_Core_Model_App::run]
* `class` [Mage_Core_Model_App][Mage_Core_Model_App] > [_initRequest()][Mage_Core_Model_App::_initRequest]

#### These code references can be used as an entry point to find answers to the questions above:

* [index.php][index.php]
* [Mage_Core_Model_App::run()][Mage_Core_Model_App::run]
* [Mage_Core_Model_Config::loadBase()][Mage_Core_Model_Config::loadBase] and [init()][Mage_Core_Model_Config::init]

#### Additional Readings

* [Magecert.com: Basics][magecert.basics]





[magecert.basics]:http://magecert.com/basics.html


[index.php]:https://github.com/AndersWik/Magento-1x/blob/master/index.php
[app/code/]:https://github.com/AndersWik/Magento-1x/tree/master/app/code
[app/etc/]:https://github.com/AndersWik/Magento-1x/tree/master/app/etc
[app/etc/modules/]:https://github.com/AndersWik/Magento-1x/tree/master/app/etc/modules
[app/Mage.php]:https://github.com/AndersWik/Magento-1x/blob/master/app/Mage.php
[Mage_All]:https://github.com/AndersWik/Magento-1x/blob/master/app/etc/modules/Mage_All.xml
[includes/config.php]:https://github.com/AndersWik/Magento-1x/blob/master/includes/config.php
[Mage]:https://github.com/AndersWik/Magento-1x/blob/master/app/Mage.php
[Mage::run]:https://github.com/AndersWik/Magento-1x/blob/master/app/Mage.php#L662
[Mage_Core_Model_Config]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Config.php
[Mage_Core_Model_Config::loadBase]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Config.php#L273
[Mage_Core_Model_Config::init]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Config.php#L248
[Mage_Core_Model_Config::_loadDeclaredModules]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Config.php#L776
[Mage_Core_Model_Config::_getDeclaredModuleFiles]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Config.php#L701
[Mage_Core_Model_Config::loadDb]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Config.php#L352
[Mage_Core_Model_Resource_Setup]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Resource/Setup.php
[Mage_Core_Model_Resource_Setup::applyAllUpdates]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Resource/Setup.php#L219
[Mage_Core_Model_Resource_Setup::applyAllDataUpdates]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Resource/Setup.php#L254
[Varien_Autoload::register]:https://github.com/AndersWik/Magento-1x/blob/master/lib/Varien/Autoload.php#L72
[Mage_Core_Model_App]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php
[Mage_Core_Model_App::run]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php#L345
[Mage_Core_Model_App::baseInit]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php#L297
[Mage_Core_Model_App::_initBaseConfig]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php#L388
[Mage_Core_Model_App::_initModules]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php#L422
[Mage_Core_Model_App::_initRequest]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php#L461
[Mage_Core_Model_App::_initCurrentStore]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php#L474
