---
layout: post
title:  Magento Developer Certification Adminhtml and System configuration
date:   2016-11-24 15:00:00
categories: Magento
---

Notes about `Magento Developer Certification Adminhtml and System configuration`.

6 - Adminhtml
====================

System configuration
--------------------

### Define the basic terms, elements, and structure of system configuration XML:

* `<tab>` defines which tab in our new section should be added to.
* `<sections>` are areas under tabs.
* `<groups>` are areas under sections.
* `<fields>` are areas under groups.
  * `<label>` defines the value that is displayed next to your field.
  * `<comment>` is a text displayed beneath the field.
  * `<frontend_type>` instantiates a [Varien_Data_Form_Element_*][Varien_Data_Form_Element_] `class`. The `*` is the value of the frontend type. If the frontend value is `select` our class will be [Varien_Data_Form_Element_Select][Varien_Data_Form_Element_Select].
  * `<source_model>` is set if our field needs predefined values we add a source model. If we have a `select` that use `adminhtml/system_config_source_yesno` we are getting the values to our select from [Mage_Adminhtml_Model_System_Config_Source_Yesno][Mage_Adminhtml_Model_System_Config_Source_Yesno]
  * `<show_in_default>` takes a boolean value (1/0). The value determines if the field can be configured in the default scope of the admin.
  * `<show_in_website>` takes a boolean value (1/0). This node determines if the field can be configured in the website scope of the admin.
  * `<show_in_store>` takes a boolean value (1/0). This node determines if the field can be configured in the storeview scope of the admin.

#### How can elements in system configuration be rendered with a custom template?



#### How does the structure of system.xml relate to the rendered elements in the System Configuration view?

#### How can the CSS class of system configuration elements be changed?

#### What is the syntax for specifying the options in dropdowns and multiselects?

* `app/code/community/my/module/etc/system.xml`

{% highlight xml %}
<config>
 <sections>
  <mymodule translate="label" module="mymodule">
   <label>My Module</label>
   <tab>general</tab>
   <frontend_type>text</frontend_type>
   <sort_order>20</sort_order>
   <show_in_default>1</show_in_default>
   <show_in_website>1</show_in_website>
   <show_in_store>1</show_in_store>
   <groups>
    <general translate="label">
     <label><![CDATA[General]]></label>
     <frontend_type>text</frontend_type>
     <sort_order>10</sort_order>
     <show_in_default>1</show_in_default>
     <show_in_website>1</show_in_website>
     <show_in_store>1</show_in_store>
     <fields>
      <active translate="label comment">
       <label><![CDATA[Enable My Module]]></label>
       <comment><![CDATA[This is some module]]></comment>
       <frontend_type>select</frontend_type>
       <source_model>adminhtml/system_config_source_yesno</source_model>
       <sort_order>10</sort_order>
       <show_in_default>1</show_in_default>
       <show_in_website>1</show_in_website>
       <show_in_store>1</show_in_store>
      </active>
     </fields>
    </general>
   </groups>
  </mymodule>
 </sections>
</config>
{% endhighlight %}

The syntax for specifying options in dropdowns and multiselects are done in the `<source_model>` node. The source model need to define a method called `toOptionsArray`. The method should return an array of values that are going to be used when populating the field. In the xml above we use [adminhtml/system_config_source_yesno][Mage_Adminhtml_Model_System_Config_Source_Yesno]. This will resolve to the `class` [Mage_Adminhtml_Model_System_Config_Source_Yesno][Mage_Adminhtml_Model_System_Config_Source_Yesno].

{% highlight php %}
`<?php
class Mage_Adminhtml_Model_System_Config_Source_Yesno
{
 public function toOptionArray()
 {
  return array(
   array('value' => 1, 'label'=>Mage::helper('adminhtml')->__('Yes')),
   array('value' => 0, 'label'=>Mage::helper('adminhtml')->__('No')),
  );
 }
}`
{% endhighlight %}

#### Which classes are used to parse and render system configuration XML?

#### What is the syntax to specify a custom renderer for a field in system configuration?

#### How does Magento store data for system configuration?

Magento stores config data in the table `core_config_data`. We can add `default` values for our module in `config.xml`.

* `app/code/community/my/module/etc/config.xml`

{% highlight xml %}
`<config>
 <default>
  <mymodule> <!-- section -->
    <general> <!-- group -->
      <active>1</active> <!-- field -->
    </general>
  </mymodule>
 </default>
</config>`
{% endhighlight %}

#### What is the difference between `Mage::getStoreConfig(...)` and `Mage::getConfig()->getNode(...)`?

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage/Adminhtml/Model/System/Config/*][Mage/Adminhtml/Model/System/Config/]
* [Mage/Adminhtml/Block/System/Config/*][Mage/Adminhtml/Block/System/Config/]

### Describe system configuration scopes:

System configuration scopes defines at what levels the configuration is available.

* `show_in_default`
* `show_in_website`
* `show_in_store`

#### How do different scopes (global, website, store) work in Magento system configuration?

* `global` are for all websites.
* `website` are for all storeviews that belong to the website.
* `store` are only for one storeview.

#### How does Magento store information about option values and their scopes?

#### These code references can be used as an entry point to find answers to the questions above:

* `core_config_data` table
* [Mage_Core_Model_Core_Config_Data][Mage_Core_Model_Core_Config_Data]
* [Mage_Core_Model_Resource_Config_Data][Mage_Core_Model_Resource_Config_Data]
* [Mage_Core_Model_Resource_Config_Data_Collection][Mage_Core_Model_Resource_Config_Data_Collection]

#### Additional Readings

* [Alan Storm: System Configuration][alanstorm.system_configuration]
* [Nathan McBride: System-Configuration][brideo.system-configuration]



[alanstorm.system_configuration]:http://alanstorm.com/custom_magento_system_configuration/
[brideo.system-configuration]:http://brideo.co.uk/magento-certification-notes/adminhtml/System-Configuration/



[Mage/Adminhtml/Model/System/Config/]:https://github.com/AndersWik/Magento-1x/tree/master/app/code/core/Mage/Adminhtml/Model/System/Config

[Mage/Adminhtml/Block/System/Config/]:https://github.com/AndersWik/Magento-1x/tree/master/app/code/core/Mage/Adminhtml/Block/System/Config

[Mage_Adminhtml_Model_System_Config_Source_Yesno]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Adminhtml/Model/System/Config/Source/Yesno.php

[Mage_Core_Model_Core_Config_Data]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Config/Data.php

[Mage_Core_Model_Resource_Config_Data]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Resource/Config/Data.php

[Mage_Core_Model_Resource_Config_Data_Collection]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Resource/Config/Data/Collection.php



[Varien_Data_Form_Element_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/lib/Varien/Data/Form/Element/Abstract.php

[Varien_Data_Form_Element_Select]:https://github.com/AndersWik/Magento-1x/blob/master/lib/Varien/Data/Form/Element/Select.php


[Varien_Data_Form_Element_]:https://github.com/AndersWik/Magento-1x/tree/master/lib/Varien/Data/Form/Element/
