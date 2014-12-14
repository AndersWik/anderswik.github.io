---
layout: post
title:  Magento Helper Log
date:   2014-12-05 22:30:00
categories: Magento
---

In the `var/log` directory you find Magentos log files, `system.log` and `exception.log`.
These are the files we print too when we use:

{% highlight php %}
Mage::log('System log');
Mage::logException($e);
{% endhighlight %}

These files will become big and cluttered. To keep these files tidy we can let our modules write too there own log files. Add the following to your modules Helper class (Data.php).

{% highlight php %}
const LOG_FILENAME = 'Namespace_Module.log';

public function log($e, $error = null) {
  Mage::log($e, $error, self::LOG_FILENAME);
}
{% endhighlight %}

Then call the method with `Mage::helper('mymodule')->log($e);` or `Mage::helper('mymodule')->log($e, Zend_Log::ERR);`. Now all your modules logs are in one place.
