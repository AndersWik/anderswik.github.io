---
layout: post
title:  Magento Delete or Change Admin Config Values
date:   2015-06-02 22:30:00
categories: Magento
---

Delete or update Core Config Data.


Using SQL
-------------

{% highlight php %}
<?php
$query = "DELETE FROM `core_config_data` WHERE path = 'general/country/default';";
$this->run($query);
?>
{% endhighlight %}


Using the Config Model
-------------

{% highlight php %}
<?php
$config = Mage::getModel('core/config');
$config->saveConfig('general/country/default', "1", 'default', 0);
?>
{% endhighlight %}


Using a helper
-------------

{% highlight php %}
<?php
const LOG_FILENAME = "some.log";
const XML_CONFIG_VALUE = "module/element/";

public function log($e, $error = null) {
  Mage::log($e, $error, self::LOG_FILENAME);
}

public function getConfigValue($q, $store = null)
{
  $store = Mage::app()->getStore();
  return Mage::getStoreConfig(self::XML_CONFIG_VALUE.$q, $store);
}

public function setConfigValue($p, $q, $store = null)
{
  $switch = new Mage_Core_Model_Config();
  $switch ->saveConfig($p, $q, 'default', 0);
}
?>
{% endhighlight %}
