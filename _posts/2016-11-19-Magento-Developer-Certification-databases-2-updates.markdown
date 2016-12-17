---
layout: post
title:  Magento Developer Certification Working with Databases in Magento and Install/upgrade scripts
date:   2016-11-19 15:00:00
categories: Magento
---

Notes about `Magento Developer Certification Working with Databases in Magento and Models, resource models, and collections`.

4 - Working with Databases in Magento
====================

Install/upgrade scripts
--------------------

### Describe the install/upgrade workflow

* `app/code/community/My/Module/etc/config.xml`

{% highlight xml %}
<?xml version="1.0"?>
<config>
    <modules>
        <My_Module>
            <version>0.1.0</version>
        </My_Module>
    </modules>
    <global>
        <models>
            <notes>
                <class>My_Module_Model</class>
                <resourceModel>notes_resource</resourceModel>
            </notes>
            <notes_resource>
                <class>My_Module_Model_Resource</class>
                <entities>
                    <note>
                        <table>my_module_note</table>
                    </note>
                </entities>
            </notes_resource>
        </models>
        <resources>
            <my_module_setup>
                <setup>
                    <module>My_Module</module>
                </setup>
            </my_module_setup>
        </resources>
    </global>
</config>
{% endhighlight %}

* `app/code/community/My/Module/Model/Note.php`
* [Mage_Core_Model_Abstract][Mage_Core_Model_Abstract]

{% highlight php %}
`<?php
class My_Module_Model_Note extends Mage_Core_Model_Abstract
{
    protected $_eventPrefix = 'notes_note';

    protected function _construct()
    {
        $this->_init('notes/note');
    }
}`
{% endhighlight %}

* `app/code/community/My/Module/Model/Resource/Note.php`
* [Mage_Core_Model_Resource_Db_Abstract][Mage_Core_Model_Resource_Db_Abstract]
* [Mage_Core_Model_Resource_Abstract][Mage_Core_Model_Resource_Abstract]

{% highlight php %}
`<?php
class My_Module_Model_Resource_Note extends Mage_Core_Model_Resource_Db_Abstract
{
    protected function _construct()
    {
        $this->_init('notes/note', 'note_id');
    }

}`
{% endhighlight %}

* `app/code/community/My/Module/Model/Resource/Note/Collection.php`
* [Mage_Core_Model_Resource_Db_Collection_Abstract][Mage_Core_Model_Resource_Db_Collection_Abstract]
* [Varien_Data_Collection_Db][Varien_Data_Collection_Db]
* [Varien_Data_Collection][Varien_Data_Collection]

{% highlight php %}
<?php
class My_Module_Model_Resource_Note_Collection
  extends Mage_Core_Model_Resource_Db_Collection_Abstract
{
}
{% endhighlight %}

* `app/code/community/My/Module/sql/my_module_setup/install-0.1.0.php`

{% highlight php %}
<?php
$installer = $this;
$installer->startSetup();

$table = $installer->getConnection()
    ->newTable($installer->getTable('notes/note'))
    ->addColumn('note_id', Varien_Db_Ddl_Table::TYPE_INTEGER, null, array(
        'identity'  => true,
        'nullable'  => false,
        'primary'   => true,
    ), 'Note ID')
    ->addColumn('creation_time', Varien_Db_Ddl_Table::TYPE_TIMESTAMP, null, array(
    ), 'Note Creation Time')
    ->addColumn('update_time', Varien_Db_Ddl_Table::TYPE_TIMESTAMP, null, array(
    ), 'Note Modification Time')
    ->addColumn('content', Varien_Db_Ddl_Table::TYPE_TEXT, '2M', array(
    ), 'Note Content')
    ->addColumn('title', Varien_Db_Ddl_Table::TYPE_TEXT, 255, array(
        'nullable'  => true
    ), 'Note Title')
    ->setComment('Note Table');

$installer->getConnection()->createTable($table);
$installer->endSetup();
{% endhighlight %}

* [Mage_Core_Model_Resource_Setup][Mage_Core_Model_Resource_Setup]
* [Varien_Db_Ddl_Table][Varien_Db_Ddl_Table]

### Write install and upgrade scripts using set-up resources

* `app/code/community/My/Module/etc/config.xml`

{% highlight xml %}
<config>
    <global>
        <resources>
            <my_module_setup>
                <setup>
                    <module>My_Module</module>
                </setup>
            </my_module_setup>
        </resources>
    </global>
</config>
{% endhighlight %}

### Identify how to use the DDL class in setup scripts

#### Each module can encapsulate the preparation and upgrade of the database table it requires via setup scripts.

#### Under which circumstances are setup scripts executed?

#### What is the difference between the different classes used to execute setup scripts?

#### Which is the base setup class for flat table entities, and which one the base for EAV entities?

#### Which methods are generally available in setup scripts to manipulate database tables and indexes?

#### What is the difference between addAttribute() and updateAttribute() in EAV setup scripts?

#### How can you implement a rollback in Magento?

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Core_Model_App::run()][Mage_Core_Model_App::run] and [_initModules()][Mage_Core_Model_App::_initModules]
* [Mage_Core_Model_Resource_Setup::applyAllUpdates()][Mage_Core_Model_Resource_Setup::applyAllUpdates] and [applyAllDataUpdates()][Mage_Core_Model_Resource_Setup::applyAllDataUpdates]
* [Mage_Eav_Model_Entity_Setup::addAttribute()][Mage_Eav_Model_Entity_Setup::addAttribute] and [updateAttribute()][Mage_Eav_Model_Entity_Setup::updateAttribute]


#### Additional Readings

* [Solving Magento: Magento EAV System][divisionlab.eav-system]
* [Inchoo: Magento Install, Upgrade and Data Scripts][inchoo.install-upgrade-data-scripts]


[divisionlab.eav-system]:http://www.divisionlab.com/solvingmagento/magento-eav-system/

[inchoo.install-upgrade-data-scripts]:http://inchoo.net/magento/magento-install-install-upgrade-data-and-data-upgrade-scripts/


[Mage_Core_Model_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Abstract.php

[Mage_Core_Model_Resource_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Resource/Abstract.php

[Mage_Core_Model_Resource_Db_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Resource/Db/Abstract.php

[Mage_Core_Model_Resource_Db_Collection_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Resource/Db/Collection/Abstract.php

[Mage_Core_Model_App]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php
[Mage_Core_Model_App::run]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php#L345
[Mage_Core_Model_App::_initModules]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php#L422

[Mage_Core_Model_Resource_Setup]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Resource/Setup.php
[Mage_Core_Model_Resource_Setup::applyAllUpdates]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Resource/Setup.php#L219

[Mage_Core_Model_Resource_Setup::applyAllDataUpdates]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Resource/Setup.php#L254

[Mage_Eav_Model_Entity_Setup]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Eav/Model/Entity/Setup.php
[Mage_Eav_Model_Entity_Setup::addAttribute]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Eav/Model/Entity/Setup.php#L646
[Mage_Eav_Model_Entity_Setup::updateAttribute]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Eav/Model/Entity/Setup.php#L774

[Varien_Data_Collection]:https://github.com/AndersWik/Magento-1x/blob/master/lib/Varien/Data/Collection.php

[Varien_Data_Collection_Db]:https://github.com/AndersWik/Magento-1x/blob/master/lib/Varien/Data/Collection/Db.php

[Varien_Db_Ddl_Table]:https://github.com/AndersWik/Magento-1x/blob/master/lib/Varien/Db/Ddl/Table.php
