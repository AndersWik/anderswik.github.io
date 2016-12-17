---
layout: post
title:  Magento Developer Certification Basics of Internationalization
date:   2016-10-28 22:30:00
categories: Magento
---

Notes about `Magento Developer Certification the Basics of internationalization Chapter`.

1 - Basics
====================

Internationalization
--------------------

### Describe how to plan for internationalization of a Magento site

Magento have a multistore setup. We can have several stores in one installation.

* `websites`
* `stores`
* `store views`

Magento can have multiple `websites` each website can have multiple `stores` and each `store` can have several `store views`. The `store views` are meant for translation of the site. There are three types of translations.

* `Module` (`csv`)
* `Theme` (`csv`)
* `Database` (`inline`)

Module translation files are stored in `app/locale/{language_code}_{COUNTRY_CODE}/{namespace}_{modulename}.xml`
and theme translations are store in `app/design/{design_area}/{package_name}/{theme}/locale/{language_code}_{COUNTRY_CODE}/translation.csv`

If we want to be able to translate a text we print it like below.

{% highlight php %}
`<?php echo $this->__('Hello'); ?>`
{% endhighlight %}

In the csv file we add the translation `"Hello","Hi"` to the `csv` file. One translation is one row. To add module specific translations in the `theme` we add the `module` `namespace` and name before the translation. For `Mage_Sales` it would be `"Mage_Sales::Active","Enabled"`. To add translations to the database go to `System > Configuration > Developer > Translate Inline`. Then the translations can be added in the frontend. The translations are stored in `core_translate table`. If a string are translated in several places the `inline translation` will take precedence over the `theme` translation. The `theme` translation will take priority over the `module` translation.

### Describe the use of Magento translate classes and translate files

All helpers and blocks have a translation function. The translation function are implemented in the same way in both helpers and blocks. For blocks the translation method is implemented in [Mage_Core_Block_Abstract::  ()][Mage_Core_Block_Abstract::__()]. To translate a text in a block we use `$this->__('Some Text');`. When translating a text in a template we also use the block translation function, `<?php echo $this->__('Some Text'); ?>`.

For helpers the translation function is implemented in [Mage_Core_Helper_Abstract::  ()][Mage_Core_Helper_Abstract::__()]. The `__()` `function` in  the [Mage_Core_Helper_Abstract][Mage_Core_Helper_Abstract] `class` looks exactly like the one in [Mage_Core_Block_Abstract][Mage_Core_Block_Abstract]. We can use helpers to translate strings outside blocks and templates. We can call `Mage::helper('core')->__('Some Text');`. Although blocks have a translation function we can call a helper to translate in our template our block. This can be useful if we want to use one modules translations in another modules templates.

{% highlight php %}
`<?php
public function __()
{
 $args = func_get_args();
 $expr = new Mage_Core_Model_Translate_Expr(array_shift($args), $this->getModuleName());
 array_unshift($args, $expr);
 return $this->_getApp()->getTranslator()->translate($args);
}`
{% endhighlight %}

The `__()` function gets the arguments and creates a Translation Expression. It adds the string that needs translating and the module name to the expression. We call [Mage::app()][Mage::app] and get our instance of [Mage_Core_Model_App][Mage_Core_Model_App]. Then we call [Mage_Core_Model_App::getTranslator()][Mage_Core_Model_App::getTranslator].

{% highlight php %}
`<?php
public function getTranslator()
{
 if (!$this->_translator) {
  $this->_translator = Mage::getSingleton('core/translate');
 }
 return $this->_translator;
}`
{% endhighlight %}

[Mage_Core_Model_Translate][Mage_Core_Model_Translate]

{% highlight php %}
`<?php
class Mage_Core_Model_Translate
{
 public function translate($args)
 {
  $text = array_shift($args);

  if (is_string($text) && ''==$text
    || is_null($text)
    || is_bool($text) && false===$text
    || is_object($text) && ''==$text->getText()) {
   return '';
  }
  if ($text instanceof Mage_Core_Model_Translate_Expr) {
   $code = $text->getCode(self::SCOPE_SEPARATOR);
   $module = $text->getModule();
   $text = $text->getText();
   $translated = $this->_getTranslatedString($text, $code);
  }
  else {
   if (!empty($_REQUEST['theme'])) {
    $module = 'frontend/default/'.$_REQUEST['theme'];
   } else {
    $module = 'frontend/default/default';
   }
   $code = $module.self::SCOPE_SEPARATOR.$text;
   $translated = $this->_getTranslatedString($text, $code);
  }

  //array_unshift($args, $translated);
  //$result = @call_user_func_array('sprintf', $args);

  $result = @vsprintf($translated, $args);
  if ($result === false) {
   $result = $translated;
  }

  if ($this->_translateInline && $this->getTranslateInline()) {
   if (strpos($result, '{{{')===false || strpos($result, '}}}')===false || strpos($result, '}}{{')===false) {
    $result = '{{{'.$result.'}}{{'.$translated.'}}{{'.$text.'}}{{'.$module.'}}}';
   }
  }

  return $result;
 }
}`
{% endhighlight %}

{% highlight php %}
`<?php
class Mage_Core_Model_Translate
{
 public function init($area, $forceReload = false)
 {
  $this->setConfig(array(self::CONFIG_KEY_AREA=>$area));

  $this->_translateInline = Mage::getSingleton('core/translate_inline')
            ->isAllowed($area=='adminhtml' ? 'admin' : null);

   if (!$forceReload) {
    if ($this->_canUseCache()) {
     $this->_data = $this->_loadCache();
     if ($this->_data !== false) {
      return $this;
    }
   }
   Mage::app()->removeCache($this->getCacheId());
  }

  $this->_data = array();

  foreach ($this->getModulesConfig() as $moduleName=>$info) {
   $info = $info->asArray();
   $this->_loadModuleTranslation($moduleName, $info['files'], $forceReload);
  }

  $this->_loadThemeTranslation($forceReload);
  $this->_loadDbTranslation($forceReload);

  if (!$forceReload && $this->_canUseCache()) {
   $this->_saveCache();
  }

  return $this;
 }
}`
{% endhighlight %}

All three translation types are called in the `init` `function`.

* `_loadModuleTranslation`
* `_loadThemeTranslation`
* `_loadDbTranslation`

{% highlight php %}
`<?php
class Mage_Core_Model_Translate
{
 protected function _addData($data, $scope, $forceReload=false)
 {
  foreach ($data as $key => $value) {
   if ($key === $value) {
    continue;
   }
   $key    = $this->_prepareDataString($key);
   $value  = $this->_prepareDataString($value);
  if ($scope && isset($this->_dataScope[$key]) && !$forceReload ) {
   /**
    * Checking previos value
    */
    $scopeKey = $this->_dataScope[$key] . self::SCOPE_SEPARATOR . $key;
    if (!isset($this->_data[$scopeKey])) {
     if (isset($this->_data[$key])) {
      $this->_data[$scopeKey] = $this->_data[$key];
      /**
       * Not allow use translation not related to module
       */
      if (Mage::getIsDeveloperMode()) {
       unset($this->_data[$key]);
      }
     }
    }
    $scopeKey = $scope . self::SCOPE_SEPARATOR . $key;
    $this->_data[$scopeKey] = $value;
   }
   else {
    $this->_data[$key]     = $value;
    $this->_dataScope[$key]= $scope;
   }
  }
  return $this;
 }
}`
{% endhighlight %}

### Describe the advantages and disadvantages of using subdomains and subdirectories in internationalization

### To verify your understanding of these objectives, ask yourself the following questions:

#### Which method is used for translating strings, and on which types of objects is it generally available?

There are three types of translations.

* `Module` (`csv`)
* `Theme` (`csv`)
* `Database` (`inline`)

Module translation files are stored in `app/locale/[language_code]_[COUNTRY_CODE]/[namespace]_[modulename].xml`.

Theme translations are store in `app/design/[design_area]/[package_name]/[theme]/locale/[language_code]_[COUNTRY_CODE]/translation.csv`

If we want to translate a text in a template (`phtml`) file we type:

{% highlight php %}
<?php echo $this->__('Some text to translate'); ?>
{% endhighlight %}


If we want to translate a text in a `php` file we type:

{% highlight php %}
<?php
Mage::helper('core')->__("Some text to translate")
{% endhighlight %}

#### In what way does the developer mode influence how Magento handles translations?

In the `function` [_addData][Mage_Core_Model_Translate::_addData] in the `class` [Mage_Core_Model_Translate][Mage_Core_Model_Translate] "is developer mode" is checked.

{% highlight php %}
`<?php
/**
 * Not allow use translation not related to module
 */
 if (Mage::getIsDeveloperMode()) {
  unset($this->_data[$key]);
 }`
{% endhighlight %}

#### How many options exist to add a custom translation for any given string?

There are three types of translations.

* `Module` (`csv`)
* `Theme` (`csv`)
* `Database` (`inline`)

#### What is the priority of translation options?

First the `module` translations are loaded. Then the `theme` translations. If the same translation is found in the `theme` translation it replaces the `module` translation. Then the `inline` translation is loaded if the same `string` is found it replaces the `module/theme` translations. The last translation loaded will take priority.

* `Module translations`
* `Theme translations`
* `Inline translations`


#### How are translation conflicts (when two modules translate the same string) processed by Magento?

Each module will translate their own `string`.

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Core_Model_Translate::init()][Mage_Core_Model_Translate::init]
* [Mage_Core_Model_Locale::emulate()][Mage_Core_Model_Locale::emulate]

#### Additional Readings


[php.array-unshift]:http://php.net/manual/en/function.array-unshift.php
[php.array-shift]:http://php.net/manual/en/function.array-shift.php

[Mage::app]:https://github.com/AndersWik/Magento-1x/blob/master/app/Mage.php#L606
[Mage_Core_Block_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Block/Abstract.php
[Mage_Core_Block_Abstract::__()]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Block/Abstract.php#L1139
[Mage_Core_Helper_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Helper/Abstract.php
[Mage_Core_Helper_Abstract::__()]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Helper/Abstract.php#L181
[Mage_Adminhtml_Controller_Action]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Adminhtml/Controller/Action.php
[Mage_Core_Controller_Front_Action]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Controller/Front/Action.php
[Mage_Core_Model_App]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php
[Mage_Core_Model_App::getTranslator]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php#L1045
[Mage_Core_Model_Translate]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Translate.php
[Mage_Core_Model_Translate::_addData]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Translate.php#L230
[Mage_Core_Model_Translate::init]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Translate.php#L112
[Mage_Core_Model_Translate::translate]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Translate.php#L387
[Mage_Core_Model_Locale::emulate]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Locale.php#L738
