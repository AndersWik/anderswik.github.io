---
layout: post
title:  Magento Developer Certification Adminhtml and Working with extensions in Magento
date:   2016-11-24 15:00:00
categories: Magento
---

Notes about `Magento Developer Certification Adminhtml and Working with extensions in Magento`.

6 - Adminhtml
====================

Working with extensions in Magento
--------------------

### Describe how to enable and configure extensions

To enable an extension we copy the module to our Magento installation. To make sure the module is enabled we can look in `app/etc/modules/{namespace}_{modulename}.xml` and make sure the active node is set to `true`.

To disable an extension we can set the `active` node in `app/etc/modules/my_module.xml` to false.

{% highlight xml %}
<config>
 <modules>
  <My_Module>
   <active>false</active>
   <codePool>core</codePool>
   <depends>
    <Mage_Core/>
   </depends>
  </My_Module>
 </modules>
</config>
{% endhighlight %}

If we want to disable the printing of blocks but not disable the entire module we can go to `system > configuration > advanced` and set our module to disabled. This will not turn off the module this will only stop blocks from printing. This check is done in [Mage_Core_Block_Abstract::toHtml][Mage_Core_Block_Abstract::toHtml].

If the module can be configured we can go to `System > Configuration` and do it there.

{% highlight php %}
`<?php
abstract class Mage_Core_Block_Abstract extends Varien_Object
{
 final public function toHtml()
 {
  Mage::dispatchEvent('core_block_abstract_to_html_before', array('block' => $this));
  if (Mage::getStoreConfig(
   'advanced/modules_disable_output/' . $this->getModuleName())) {
   return '';
  }
  /***/
 }
}`
{% endhighlight %}

### Define Magento extensions and describe the different types of extension available(Community, Core, Commercial)

* Core extensions are bundled with the Magento installation.
* Community extensions can be installed for free from Magento Connect.
* Commercial extension are paid for and bought from the developers site.

#### Questions to ask yourself:

#### In which folders are Magento extensions files located?

* `app/etc/modules/`
* `app/code/community/`

#### Which files are necessary to make custom modules work?

* `app/etc/modules/my_module.xml`
* `app/code/community/My/Module/etc/config.xml`

#### How can module dependencies be manipulated?

{% highlight xml %}
<config>
 <modules>
  <My_Module>
   <active>true</active>
   <codePool>core</codePool>
   <depends>
    <Mage_Core/>
   </depends>
  </My_Module>
 </modules>
</config>
{% endhighlight %}

#### What is the role of the downloader?

Magento uses the `/downloader` to install programs via the Magento Connect Manager.

#### How can modules be installed through Magento Connect?

* `System > Magento Connect > Magento Connect Manager`

This will open the Magento Connect Manager in a new window. You will need to login with your administrative credentials again. Then go to [www.magentocommerce.com/magento-connect/][magento-connect] and get the extension key of the module you want to add. Then in the Magento Connect Manager. Go to the extensions tab and paste the key in the text field and press `install`.

#### A better way to install Magento Modules.

Go to [freegento.com/ddl-magento-extension.php][freegento.com] and paste the extension key to the text area and press submit. Now use the link to download the module. This way we can add the module with [modman][modman] instead.


#### Additional Readings

[magento-connect]:https://www.magentocommerce.com/magento-connect/
[freegento.com]:http://freegento.com/ddl-magento-extension.php
[modman]:https://github.com/colinmollenhour/modman



[Mage_Core_Block_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Block/Abstract.php

[Mage_Core_Block_Abstract::toHtml]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Block/Abstract.php#L908
