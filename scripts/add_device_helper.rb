#!/usr/bin/env ruby
require 'xcodeproj'

project_path = File.join(__dir__, '..', 'ios', 'PapaGeil.xcodeproj')
project = Xcodeproj::Project.open(project_path)

# Find the PapaGeil target
target = project.targets.find { |t| t.name == 'PapaGeil' }
unless target
  puts "ERROR: Target 'PapaGeil' not found!"
  exit 1
end

# Find the PapaGeil group
group = project.main_group.find_subpath('PapaGeil', false)
unless group
  puts "ERROR: Group 'PapaGeil' not found!"
  exit 1
end

swift_path = File.join(__dir__, '..', 'ios', 'PapaGeil', 'DeviceHelper.swift')
m_path = File.join(__dir__, '..', 'ios', 'PapaGeil', 'DeviceHelper.m')

# Add DeviceHelper.swift
unless group.files.any? { |f| f.path == 'DeviceHelper.swift' }
  swift_ref = group.new_file(swift_path)
  target.source_build_phase.add_file_reference(swift_ref)
  puts "Added DeviceHelper.swift"
else
  puts "DeviceHelper.swift already exists"
end

# Add DeviceHelper.m
unless group.files.any? { |f| f.path == 'DeviceHelper.m' }
  m_ref = group.new_file(m_path)
  target.source_build_phase.add_file_reference(m_ref)
  puts "Added DeviceHelper.m"
else
  puts "DeviceHelper.m already exists"
end

project.save
puts "Project saved successfully!"
