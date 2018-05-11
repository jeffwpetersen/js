---
layout: post
title:  "Drupal 8 image migration with images from xml or csv file"
date:   2017-05-04 00:00:19 -0500
categories: posts
excerpt_separator: <!-- more -->
---

Full module on github: <a href="https://github.com/jeffwpetersen/drupal_8_xml_image_migration">Drupal 8 XML image migration</a>

Import content into Drupal 8 with associated image files using a csv or xml file. Importing will require 2 configuration files. One for the images and one for the nodes.
Image files are references and need to be migrated and referenced using the id that uniquely identifies the imported item. This id is stored in the migrate system.


First configure the source of your images data, in this case I'm useing the XML parser.<br />
Define your id: I'm using the name of the image which I have labled with the machine name name_image.<br />
Next define field names and then source location and destination.


<!-- more -->


Import Images
------------
{% highlight yaml linenos %}
    # Migration configuration for copying and tagging a file for import

    id: import_image #migrate_machine_name
    label: Childrens Book Reading List.
    migration_group: book_data #migrate_machine_name
    migration_tags:
      - file
      - image
    source:
      # We use the XML data parser plugin.
      plugin: url
      data_fetcher_plugin: http
      data_parser_plugin: xml
      # Normally, this is one or more fully-qualified URLs or file paths. Because
      # we can't hardcode your local URL, we provide a relative path here which
      # hook_install() will rewrite to a full URL for the current site.
      urls: modules/drupal_8_xml_image_migration/book.xml
      # Visit the URL above (relative to your site root) and look at it. You can see
      # that <response> is the outer element, and each item we want to import is a
      # <position> element. The item_xpath value is the xpath to use to query the
      # desired elements.
      item_selector: /root/row
      # Under 'fields', we list the data items to be imported. The first level keys
      # are the source field names we want to populate (the names to be used as
      # sources in the process configuration below). For each field we're importing,
      # we provide a label (optional - this is for display in migration tools) and
      # an xpath for retrieving that value. It's important to note that this xpath
      # is relative to the elements retrieved by item_xpath.
      fields:
        -
          name: name_image
          label: 'Position name'
          selector: image
        -
          name: my_unique_id
          label: 'Unique position identifier'
          selector: num

      # Under 'ids', we identify source fields populated above which will uniquely
      # identify each imported item. Use the id as the source: value in your field.
      # The 'type' makes sure the migration map table
      # uses the proper schema type for stored the IDs.
      ids:
        name_image: # <----Important: unique id of item. In this case the name of the file.
          type: string
      constants:
        file_source_uri: 'public://book_covers_source'
        file_dest_uri: 'public://book_covers/image'
    destination:
      # We will be creating entities of type "file" this time.
      plugin: 'entity:file'
      # mikeryan says...
      # By default, the system-of-record for a migration is the source data -
      # that is, when content is imported and the destination entity already exists,
      # it is entirely replaced by the source data. For the import to partially overwrite
      # the destination node, you can set "overwrite_properties" on the destination plugin:
      # overwrite_properties:
          #  - title
          #  - body
          #  - field_to_be_overwritten
          ## - field_that_wont_be_overwritten
    process:
      file_source:
        -
          plugin: concat
          delimiter: /
          source:
            - constants/file_source_uri
            - name_image
        # Make sure we don't have any url-unfriendly characters.
        -
          plugin: urlencode
      file_dest:
        -
          plugin: concat
          delimiter: /
          source:
            - constants/file_dest_uri
            - name_image
        # Make sure we don't have any url-unfriendly characters.
        -
          plugin: urlencode
      # Optionally you can set the fid: manually using my_unique_id
      # NOTE: Existing fids will be overwritten by migration.
      # fid: my_unique_id #
      uid:
        plugin: default_value
        default_value: '1'
      filemime:
        plugin: default_value
        default_value: 'image/jpeg'
      status:
        plugin: default_value
        default_value: '1'
      filename: name_image
      uri:
        plugin: file_copy
        source:
          - '@file_source'
          - '@file_dest'
    migration_dependencies:
      optional:
        - childbook_index
{% endhighlight %}




Import Nodes
------------
{% highlight yaml linenos %}
    # Migration configuration for drupal_8_xml_image_migration
    id: childbook_index #migrate_machine_name
    label: Child Books Import
    migration_group: book_data #migrate_machine_name
    source:
      # We use the XML data parser plugin.
      plugin: url
      data_fetcher_plugin: http
      data_parser_plugin: xml
      # Normally, this is one or more fully-qualified URLs or file paths. Because
      # we can't hardcode your local URL, we provide a relative path here which
      # hook_install() will rewrite to a full URL for the current site.
      urls: modules/drupal_8_xml_image_migration/book.xml
      # Visit the URL above (relative to your site root) and look at it. You can see
      # that <response> is the outer element, and each item we want to import is a
      # <position> element. The item_xpath value is the xpath to use to query the
      # desired elements.
      item_selector: /root/row
      # Under 'fields', we list the data items to be imported. The first level keys
      # are the source field names we want to populate (the names to be used as
      # sources in the process configuration below). For each field we're importing,
      # we provide a label (optional - this is for display in migration tools) and
      # an xpath for retrieving that value. It's important to note that this xpath
      # is relative to the elements retrieved by item_xpath.
      fields:
        -
          name: my_unique_id
          label: 'Unique position identifier'
          selector: num
        -
          name: name_image
          label: 'Position name'
          selector: image
        -
          name: name_body
          label: 'Position name'
          selector: body
        -
          name: name_title
          label: 'Position name'
          selector: caption_title

      # Under 'ids', we identify source fields populated above which will uniquely
      # identify each imported item. The 'type' makes sure the migration map table
      # uses the proper schema type for stored the IDs.
      ids:
        my_unique_id:
          type: string
    destination:
      plugin: entity:node
      default_bundle: children_book # Destination bundle machine name.
    process:
      type:
        plugin: default_value
        default_value: children_book # my_destination_node_machine_name
      title: name_title # destination_machine_name: source_value_referenced_above
      sticky:
        plugin: default_value
        default_value: 0
      body: name_body
      field_title: name_title

    # field_image:
    #    plugin: migration
    #    migration: import_image #migrate_machine_name
    #    # no_stub: true
    #    # The name of the file is the id used to
    #    # uniquely identify each imported item.
    #    source: name_image # <----Important: unique id of item. In this case the name of the file.
    #    # Alternatively set and use the fid.
    #    # source: my_unique_id

       #################
       # if you have alt and title fields you need to enclose the field name in
       # quotes and add target_id.
       #################

      'field_image/target_id':
         plugin: migration
         migration: import_image #migrate_machine_name
         source: name_image # <----Important: unique id of item. In this case the name of the file.
      'field_image/alt':
         plugin: default_value
         default_value: 'What a great selection timmy'
      'field_image/title':
        plugin: default_value
        default_value: 'hooray for reading'
{% endhighlight %}
