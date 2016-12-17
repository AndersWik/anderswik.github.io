---
layout: post
title:  Magento Developer Certification Adminhtml and Access Control Lists (ACL) and permissions in Magento
date:   2016-11-24 15:00:00
categories: Magento
---

Notes about `Magento Developer Certification Adminhtml and Access Control Lists (ACL) and permissions in Magento`.

6 - Adminhtml
====================

Access Control Lists (ACL) and permissions in Magento
--------------------

### Define/identify basic terms and elements of ACL

ACL (Access Control lists) is used to restrict what resources a user can access in Magentos. The ACL applies both to admin and API users. If a user do not have permission to view a resource this item will be removed from the menu.

A module will add menu items in system.xml and add

* [app/code/core/Mage/Paypal/etc/adminhtml.xml][Paypal/etc/adminhtml.xml]
* [app/code/core/Mage/Paypal/etc/system.xml][Paypal/etc/system.xml]

### Use ACL to:

#### Set up a menu item

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

#### Create appropriate permissions for users

* `app/code/community/my/module/etc/adminhtml.xml`

{% highlight xml %}
<config>
 <acl>
  <resources>
   <all>
    <title>Allow Everything</title>
   </all>
   <admin>
    <children>
     <system>
      <children>
       <config>
        <children>
         <mymodule translate="title" module="mymodule">
          <title>my_modules</title>
         </mymodule>
        </children>
       </config>
      </children>
     </system>
    </children>
   </admin>
  </resources>
 </acl>
</config>
{% endhighlight %}

#### Check for permissions in permissions management tree structures





#### To verify your understanding, ask yourself these questions:

#### For what purpose is the `_isAllowed()` method used and which class types implement it?

The [_isAllowed()][Mage_Adminhtml_Controller_Action::_isAllowed] method is used by [Mage_Adminhtml_Controller_Action][Mage_Adminhtml_Controller_Action]. All Admin Panel action controller inherit from [Mage_Adminhtml_Controller_Action][Mage_Adminhtml_Controller_Action].

#### What is the XML syntax for adding new menu element?

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

#### What is adminhtml.xml used for? Which class parses it, and which class applies it?

In adminhtml.xml we define user permissions and meny items.

#### Where is the code located that processes the ACL XML and where is the code that applies it?

[Mage_Admin_Model_Config::loadAclResources][Mage_Admin_Model_Config::loadAclResources]

#### What is the relationship between Magento and Zend_Acl?

[Mage_Admin_Model_Acl][Mage_Admin_Model_Acl] extends [Zend_Acl][Zend_Acl]

{% highlight php %}
<?php
class Mage_Admin_Model_Acl extends Zend_Acl
{% endhighlight %}

#### How is ACL information stored in the database?

* `admin_role`
* `admin_rule`

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Admin_Model_Acl][Mage_Admin_Model_Acl]
* [Mage_Admin_Model_Acl_Resource][Mage_Admin_Model_Acl_Resource]
* [Mage_Admin_Model_Acl_Role][Mage_Admin_Model_Acl_Role]
* [Mage_Admin_Model_Resource_Acl][Mage_Admin_Model_Resource_Acl]
* [Mage_Admin_Model_Resource_Role][Mage_Admin_Model_Resource_Role]
* [Mage_Admin_Model_Resource_Roles][Mage_Admin_Model_Resource_Roles]
* [Mage_Admin_Model_Resource_Rules][Mage_Admin_Model_Resource_Rules]

#### Additional Readings

* [Alan Storm: Magento ACL Authentication][alanstorm.acl_authentication]
* [Nathan McBride: Access Control Lists (ACL) and Permissions][brideo.acl]


[alanstorm.acl_authentication]:http://alanstorm.com/magento_acl_authentication/
[brideo.acl]:http://brideo.co.uk/magento-certification-notes/adminhtml/Access-Control-Lists-(ACL)-and-Permissions-in-Magento/


[Paypal/etc/adminhtml.xml]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Paypal/etc/adminhtml.xml
[Paypal/etc/system.xml]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Paypal/etc/system.xml

[Mage_Admin_Model_Acl]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Admin/Model/Acl.php
[Mage_Admin_Model_Acl_Resource]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Admin/Model/Acl/Resource.php
[Mage_Admin_Model_Acl_Role]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Admin/Model/Acl/Role.php

[Mage_Admin_Model_Config]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Admin/Model/Config.php
[Mage_Admin_Model_Config::loadAclResources]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Admin/Model/Config.php#L90

[Mage_Adminhtml_Controller_Action]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Adminhtml/Controller/Action.php

[Mage_Adminhtml_Controller_Action::_isAllowed]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Adminhtml/Controller/Action.php#L72

[Mage_Admin_Model_Resource_Acl]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Admin/Model/Resource/Acl.php
[Mage_Admin_Model_Resource_Role]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Admin/Model/Resource/Role.php
[Mage_Admin_Model_Resource_Roles]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Admin/Model/Resource/Roles.php
[Mage_Admin_Model_Resource_Rules]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Admin/Model/Resource/Rules.php

[Zend_Acl]:https://github.com/AndersWik/Magento-1x/blob/master/lib/Zend/Acl.php
