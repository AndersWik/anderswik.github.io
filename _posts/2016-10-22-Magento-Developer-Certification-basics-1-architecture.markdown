---
layout: post
title:  Magento Developer Certification Basics of Architecture
date:   2016-10-22 22:30:00
updated:   2016-11-03 22:30:00
categories: Magento
---

Notes about `Magento Developer Certification the Basics of architecture Chapter`.

1 - Basics
====================

High-level Magento architecture
--------------------

### Describe Magento codepools

Magento `code pools` are the different folders located under [app/code/][app/code/]. This is one of the places Magento will look for module files. There are three different folders.

* `local`: this is where modules developed for the specific Magento installation is located.
* `community`: this is where modules that are developed by the community
are located.
* `core`: this is the Magento core files. Do not put your own modules here. This folder is for Magento core developers.
* `lib`: is also added to the paths array. This is not a code pool. This is where the Zend Framework and other libraries are located.

The folders are defined in [app/Mage.php][app/Mage.php].
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
 ?>
{% endhighlight %}

We can turn of the use of all modules that are located in the `local` folder. In the file [app/etc/local.xml][app/etc/local.xml] there is a setting for disabling all local modules. Change the line `disable_local_modules` from `false` to `true`.

{% highlight xml %}
<disable_local_modules>true</disable_local_modules>
{% endhighlight %}

The check to see if `local` modules should be used are done in the `class` [Mage_Core_Model_Config][Mage_Core_Model_Config]. It is the `function` [_canUseLocalModules][Mage_Core_Model_Config::_canUseLocalModules] that change the includes path and removes the `local` folder.

{% highlight php %}
<?php
class Mage_Core_Model_Config extends Mage_Core_Model_Config_Base
{
 /***/

  protected function _canUseLocalModules()
  {
    /***/

    if ($disableLocalModules && !defined('COMPILER_INCLUDE_PATH')) {
     set_include_path(
     // excluded '/app/code/local'
      BP . DS . 'app' . DS . 'code' . DS . 'community' . PS .
      BP . DS . 'app' . DS . 'code' . DS . 'core' . PS .
      BP . DS . 'lib' . PS .
      Mage::registry('original_include_path')
      );
    }
    /***/
  }
  /***/
}
{% endhighlight %}

### Describe typical Magento module structure

A Magento module must have an `xml` file in the [app/etc/modules/][app/etc/modules/] folder. The name of the file will be the `namespace` of the module and the module name separated with a underscore (`{namespace}_{modulename}.xml`).

{% highlight xml %}
<?xml version="1.0" ?>
<config>
 <modules>
  <{Namespace}_{Modulename}>
   <active>true</active>
   <codePool>community</codePool>
   </{Namespace}_{Modulename}>
 </modules>
</config>
{% endhighlight %}

The file would look something like the `xml` above. In this file we define the module `namespace` and name. We also define in what `codepool` the module will be placed.
We can also turn the module off by changing the `active` node to `false`. Depending on if the module is a `local` or `community` extension it will be placed in the `app/code/local` or `app/code/community` folder.

In the `local/community` folder there will be a folder with the same name as the modules `namespace`. This is often the company name. In the `namespace` folder there will be a subdirectory with the modules (`app/code/{local/community}/{namespace}/{modulename}`) name. This is where the modules files are located. There are an exception, frontend related files (templates, layout files etc) will be located in the [app/design/][app/design/] folder.

* `Block`
* `Controller`
* `controllers`
* `data`
* `etc`
* `Helper`
* `Model`
* `sql`

In the module folder there are a `etc` folder. This is where the modules configuration files are located. The folders `Block`, `Helper` and `Model` are capitalized. This is because the files in these folders are loaded with the autoloader. Files in folders that are loaded in other ways are not capitalized.

### Describe Magento templates and layout files location

There are three design areas in Magento.

* `adminhtml`
* `frontend`
* `install`

The template and layout files are located in different locations depending on whether they are meant to be available for the `frontend` or `backend` (`admin`).

* [app/design/frontend/][app/design/frontend/]
* [app/design/adminhtml/][app/design/adminhtml/]

If we use `frontend` as an example. Beneath the `frontend` folder the theme `package` folder are located. These folder contains all themes that are related to each other. If we look at the `default` theme in the `base` package ([app/design/frontend/base/default][app/design/frontend/base/default]). The `default` theme have the following folders.

* `etc`
* `layout`
* `template`

If we have theme translations we would also have a `locale` folder. We would add a subdirectory for each language we want to translate and name it `{language code}_{country code}`.

* `default/`
  * `locale/`
    * `en_US/`
      * `translate.csv`
    * `sv_SE/`
      * `translate.csv`

The content in a `translate.csv` file should be one translation per row. First the phrase that should be translated surrounded with quotation marks. Then what it should be translated to. Also surrounded with quotation marks (`"Translation one","Översättning ett."`). We can also translate modules in a theme. This will take precedence over the translations in the module when the theme is used. To do this we add the module name space and name inside the quotation marks of the phrase that are going to be translated (`"Mage_Sales::About This Order:","About This Order:"`).

A package can contain several different themes. An example is [app/design/frontend/default/][app/design/frontend/default/]. This package contains four themes.

* `blank`
* `default`
* `iphone`
* `modern`

The main theme is the `default` theme. All other themes will be child themes and fallback to `default` if a file is missing in the theme. We can also use the `theme.xml` file in the `etc` folder to specify a parent. The syntax is `{package}/{theme}`.

{% highlight xml %}
<?xml version="1.0"?>
<theme>
 <parent>default/default</parent>
</theme>
{% endhighlight %}

### Describe Magento skin and JavaScript files location

Magento stores the `skin` files in a folder called [skin][skin] in the root folder. The path to the `skin` files for a specific theme will mimic the path the theme have in [app/design/][app/design/].

A theme with the path `app/design/{custompackage}/{custometheme}/` will have the skin files in
`skin/frontend/{custompackage}/{customtheme}/css` and `skin/frontend/{custompackage}/{customtheme}/js`.

Magento can also store theme independent `js` in the [root/js][js] folder. This folder are used by modules and not themes.

### Identify and explain the main Magento design areas (adminhtml and frontend)

The main design areas are located in [app/design/][app/design/].

* `adminhtml`
* `frontend`
* `install`

The names describe what part of Magento they belong to. `Adminhtml` are the design area for the admin. `Frontend` are the part that interact with customers. Install is only for the installation of Magento.

In [app/design/adminhtml/][app/design/adminhtml/] Magento have one package and one theme for the admin.

* [default/default/][app/design/adminhtml/default/default/]

In [app/design/frontend/][app/design/frontend/] there are three packages that come with Magento, `base`, `default` and `rwd` (MEE 1.14 and MCE 1.9). Magento Enterprise Edition have the package `enterprise` instead of `default`.

* [base/default/][app/design/frontend/base/default/]
* [default/blank/][app/design/frontend/default/blank/]
* [default/default/][app/design/frontend/default/default/]
* [default/iphone/][app/design/frontend/default/iphone/]
* [default/modern/][app/design/frontend/default/modern/]
* [rwd/default/][app/design/frontend/rwd/default/] [(MEE 1.14 and MCE 1.9)][devdocs.rwd]

Each package have a `default` theme. This is the theme Magento first fallback to when the none `default` themes do not have the needed files. Magento will then fallback to the `base/default` theme. Unless other themes are set as fallback before. Infinit fallback where introduced in [MCE 1.9][alanstorm.magento_infinite_fallback]

`app/design/frontend/{pakagename}/{themename}/`

* `template`
* `layout`
* `locale`

`skin/frontend/{pakagename}/{themename}/`

* `css`
* `js`

### Explain class naming conventions and their relationship with the autoloader

Magento `class` names depends on where the files are placed in the file system. This structure enables Magento to find the file that contain the `class`. Magento `Codepools` are different folders located under [app/code/][app/code/]. There are three different folders.

* `local`
* `community`
* `core`

Magento will use these `codepools` when looking for files. The `codepools` are defined in [app/Mage.php][app/Mage.php].

{% highlight php %}
`<?php
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
 Varien_Autoload::register();`
{% endhighlight %}

After the `codepools` are set the [Varien/Autoload.php][lib/Varien/Autoload.php] `class` are included. Then the `function` [Varien_Autoload::register][Varien_Autoload::register] is called to register the [Varien_Autoload::autoload][Varien_Autoload::autoload] `function` with `php` [spl_autoload_register][phpautoload].

{% highlight php %}
<?php
static public function register()
{
 spl_autoload_register(array(self::instance(), 'autoload'));
}
{% endhighlight %}

We use the [Mage_Sales][Mage_Sales] module as an example of how Magento finds a `class` and then turns the `class` name into the file path. If we look in [Mage/Sales/etc/config.xml][Mage/Sales/etc/config.xml] we find a model node. The `class` node is the `class prefix`. In this case the `class prefix` is `Mage_Sales_Model`.

{% highlight xml %}
<models>
 <sales>
  <class>Mage_Sales_Model</class>
  <resourceModel>sales_resource</resourceModel>
 </sales>
</models>
{% endhighlight %}

We can use the factory method ([getModel()][Mage::getModel]) to get the `class` instance.

{% highlight php %}
<?php
$order = Mage::getModel('sales/order')->load($orderId);
{% endhighlight %}

The [getModel()][Mage::getModel] `function` is located in [app/Mage.php][app/Mage.php].

{% highlight php %}
<?php
 public static function getModel($modelClass = '', $arguments = array())
 {
  return self::getConfig()->getModelInstance($modelClass, $arguments);
 }
{% endhighlight %}

The function [getModel()][Mage::getModel] calls [getModelInstance][Mage_Core_Model_Config::getModelInstance]. The [getModelInstance][Mage_Core_Model_Config::getModelInstance] `function` is located in the `class` [Mage_Core_Model_Config][Mage_Core_Model_Config].

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

And the function [getModelInstance][Mage_Core_Model_Config::getModelInstance] calls [getModelClassName()][Mage_Core_Model_Config::getModelClassName]. [getModelClassName][Mage_Core_Model_Config::getModelClassName] is also located in [Mage_Core_Model_Config][Mage_Core_Model_Config].

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

The `function` [getModelClassName][Mage_Core_Model_Config::getModelClassName] calls [getGroupedClassName][Mage_Core_Model_Config::getGroupedClassName]. The `$groupType` parameter can be `model`, `block` or `helper`.

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

The function explodes the string `sales/order` on `/`. Then it locates the `sales` node in the `xml` and finds the `class` prefix `Mage_Sales_Model`. In this example the `function` will return `Mage_Sales_Model_Order`. This is the `class prefix` and the part after the `/`.

`Mage_Sales_Model_Order` is returned to `getModelInstance` where [class_exists][class_exists] is called.
This will check if the `class` has been defined. If it have not the `autoloader` will be called.

{% highlight php %}
<?php
public function autoload($class)
{
 if ($this->_collectClasses) {
  $this->_arrLoadedClasses[self::$_scope][] = $class;
 }
 if ($this->_isIncludePathDefined) {
  $classFile =  COMPILER_INCLUDE_PATH . DIRECTORY_SEPARATOR . $class;
 } else {
  $classFile = str_replace(' ', DIRECTORY_SEPARATOR, ucwords(str_replace('_', ' ', $class)));
 }
 $classFile.= '.php';
 //echo $classFile;die();
 return include $classFile;
}
?>
{% endhighlight %}

Magento use the [Varien_Autoload::autoload][Varien_Autoload::autoload] `function` to get the file path from the `class` name. The `autoloader` is using the [PSR-0][PSR-0] standard when converting the `class` name. First the [autoload][Varien_Autoload::autoload] `function` use [str_replace][str_replace] to replace the underscores with spaces. This gives us,

`Mage Sales Model order`

Then [ucwords][ucwords] capitalize the first letter of each word.

`Mage Sales Model Order`

Then [str_replace][str_replace] replace all spaces with a `DIRECTORY_SEPARATOR`.

`Mage/Sales/Model/Order`

The last thing it does is to add a `.php` to the end of the string.

`Mage/Sales/Model/Order.php`

And now we have the path to the file that contain the `class`. The `autoloader` will search for the file in the folders defined in [app/Mage.php][app/Mage.php]. Magento will use the same order as the folders where defined. First `local` then `community` and last `core`.

* `app/code/local/Mage/Sales/Model/Order.php`
* `app/code/community/Mage/Sales/Model/Order.php`
* `app/code/core/Mage/Sales/Model/Order.php`

### Describe methods for resolving module conflicts.

* Configuration conflict, add a depend in the module that are going to take precedence. If there are two modules, module A and module B. The configuration in module A should take precedence over the configuration in module B. Then module A should depend on module B.
* Rewrite conflict, depend one module on another. Then extend the second module to the first. Remove the rewrite from the first module an incorporate those changes into the other module.
* Theme conflict

### To verify your understanding of these objectives, ask yourself the following questions:

#### How does the framework interact with the various codepools?

Magento `codepools` are different folders located under [app/code/][app/code/]. There are three different folders.

* `local`
* `community`
* `core`

These `codepools` are defined in [app/Mage.php][app/Mage.php]. Magento use the order of how these folders where added to know in what order too use the folders when searching for a file.

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
 ?>
{% endhighlight %}

Magento will try to find module files in the three `codepools`. Magento will first look in `local` then `community` and last `core`.

#### What constitutes a namespace and a module?

A name space is the folders beneath `local/community` and `core`. The `namespace` is often the company name. This allows a company to gather all their modules under one `namespace`. None `core` developers should add there namespace folder in `local` or `community`. The namespace is always capitalized.

#### What does the structure of a complete theme look like?

A complete theme have a design package in the selected design area under [app/design/][app/design/]. This package will contain a default theme and other none default themes.

`app/design/{design_area}/{pakage_name}/{theme_name}/`

* `template`
* `layout`
* `locale`

Css and JS files are located in the [skin][skin] folder. The path to the files will mimic the path in [app/design/][app/design/].

`skin/{design_area}/{pakage_name}/{theme_name}/`

* `css`
* `js`

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Core_Model_App][Mage_Core_Model_App]
* [Mage_Core_Model_Config][Mage_Core_Model_Config]
* [Varien_Autoload][Varien_Autoload]

#### Additional Readings

* [Magecert.com: Basics][magecert.basics]
* [Magecert.com: Conflict resolution][magecert.conflict-resolution]
* [Belvg: resolving module conflicts][belvg-resolving-module-conflicts]
* [Nathan McBride: High Level Architecture][brideo.high-level-architecture]



[brideo.high-level-architecture]:http://brideo.co.uk/magento-certification-notes/basics/High-Level-Architecture/
[belvg-resolving-module-conflicts]:http://blog.belvg.com/get-ready-for-magento-certified-developer-exam-describing-methods-for-resolving-module-conflicts.html
[magecert.conflict-resolution]:http://magecert.com/basics.html#conflict-resolution
[magecert.basics]:http://magecert.com/basics.html



[alanstorm.magento_infinite_fallback]:http://alanstorm.com/magento_infinite_fallback_theme_xml/

[belvg-cron]:http://blog.belvg.com/magento-certified-developer-exam-setting-up-a-cron-job.html

[devdocs.rwd]:http://devdocs.magento.com/guides/m1x/ce19-ee114/RWD_dev-guide.html
[devdocs.mage-for-dev]:http://devdocs.magento.com/guides/m1x/magefordev/mage-for-dev-1.html
[divisionlab.magento-routers]:http://www.divisionlab.com/solvingmagento/magento-routers-a-look-under-the-hood/

[phpautoload]:http://php.net/manual/en/function.spl-autoload-register.php
[class_exists]:http://php.net/manual/en/function.class-exists.php
[str_replace]:http://php.net/manual/en/function.str-replace.php
[ucwords]:http://php.net/manual/en/function.ucwords.php

[PSR-0]:http://www.php-fig.org/psr/psr-0/

[Mage/Sales/etc/config.xml]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Sales/etc/config.xml
[lib/Varien/Autoload.php]:https://github.com/AndersWik/Magento-1x/blob/master/lib/Varien/Autoload.php
[app/code/]:https://github.com/AndersWik/Magento-1x/tree/master/app/code
[app/design/]:https://github.com/AndersWik/Magento-1x/tree/master/app/design
[app/design/adminhtml/]:https://github.com/AndersWik/Magento-1x/tree/master/app/design/adminhtml
[app/design/adminhtml/default/default/]:https://github.com/AndersWik/Magento-1x/tree/master/app/design/adminhtml/default/default
[app/design/frontend/]:https://github.com/AndersWik/Magento-1x/tree/master/app/design/frontend
[app/design/frontend/base/default]:https://github.com/AndersWik/Magento-1x/tree/master/app/design/frontend/base/default
[app/design/frontend/base/default/]:https://github.com/AndersWik/Magento-1x/tree/master/app/design/frontend/base/default
[app/design/frontend/default/]:https://github.com/AndersWik/Magento-1x/tree/master/app/design/frontend/default
[app/design/frontend/default/default/]:https://github.com/AndersWik/Magento-1x/tree/master/app/design/frontend/default/default
[app/design/frontend/default/blank/]:https://github.com/AndersWik/Magento-1x/tree/master/app/design/frontend/default/blank
[app/design/frontend/default/iphone/]:https://github.com/AndersWik/Magento-1x/tree/master/app/design/frontend/default/iphone
[app/design/frontend/default/modern/]:https://github.com/AndersWik/Magento-1x/tree/master/app/design/frontend/default/modern
[app/design/frontend/rwd/default/]:https://github.com/AndersWik/Magento-1x/tree/master/app/design/frontend/rwd/default
[app/etc/local.xml]:https://github.com/AndersWik/Magento-1x/blob/master/app/etc/local.xml.template
[app/etc/modules/]:https://github.com/AndersWik/Magento-1x/tree/master/app/etc/modules
[app/Mage.php]:https://github.com/AndersWik/Magento-1x/blob/master/app/Mage.php
[js]:https://github.com/AndersWik/Magento-1x/tree/master/js
[Mage::getModel]:https://github.com/AndersWik/Magento-1x/blob/master/app/Mage.php#L461
[Mage_Core_Model_App]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php
[Mage_Core_Model_Config]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Config.php
[Mage_Core_Model_Config::_canUseLocalModules]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Config.php#L384
[Mage_Core_Model_Config::getModelInstance]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Config.php#L1352
[Mage_Core_Model_Config::getModelClassName]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Config.php#L1331
[Mage_Core_Model_Config::getGroupedClassName]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Config.php#L1222
[Mage_Sales]:https://github.com/AndersWik/Magento-1x/tree/master/app/code/core/Mage/Sales
[Mage_Sales_Model_Order]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Sales/Model/Order.php
[skin]:https://github.com/AndersWik/Magento-1x/tree/master/skin
[Varien_Autoload]:https://github.com/AndersWik/Magento-1x/blob/master/lib/Varien/Autoload.php
[Varien_Autoload::register]:https://github.com/AndersWik/Magento-1x/blob/master/lib/Varien/Autoload.php#L72
[Varien_Autoload::autoload]:https://github.com/AndersWik/Magento-1x/blob/master/lib/Varien/Autoload.php#L82
