import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActionSheetIOS, Modal, FlatList, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import JobSeekerService from '../../Services/JobSeekerService/JobSeekerService';

const SkillsForm = ({ 
  skillTags = [], 
  onAddSkill, 
  onRemoveSkill, 
  renderSkillText 
}) => {
    const [skills, setSkills] = useState([]);
    const [selectedSkill, setSelectedSkill] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [localSkillTags, setLocalSkillTags] = useState(skillTags);

    useEffect(() => {
        // Update local state when prop changes
        setLocalSkillTags(skillTags);
    }, [skillTags]);

    useEffect(() => {
        const fetchSkills = async () => {
            try {
                const fetchedSkills = await JobSeekerService.getSkillTags();
                console.log('Fetched skills:', fetchedSkills.data);
                setSkills(fetchedSkills.data || []);
            } catch (error) {
                console.error("Error fetching skills:", error);
                setSkills([]);
            }   
        }
        fetchSkills();
    }, []);

    const selectSkill = () => {
        console.log('selectSkill called, Platform:', Platform.OS);
        console.log('Skills available:', skills.length);
        
        if (skills.length === 0) {
            Alert.alert('Thông báo', 'Không có kỹ năng nào để chọn');
            return;
        }

        // If too many skills (more than 8-10), use modal instead of ActionSheet
        if (skills.length > 8) {
            setIsModalVisible(true);
            return;
        }

        // Check if we're actually on iOS
        if (Platform.OS !== 'ios') {
            console.log('Not iOS, showing modal instead');
            setIsModalVisible(true);
            return;
        }

        // Use consistent property name - check your data structure
        const skillNames = skills.map(skill => skill.skillName || skill.name);
        const options = ['Hủy', ...skillNames];
        
        console.log('ActionSheet options:', options);
        
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: options,
                cancelButtonIndex: 0,
                title: 'Chọn kỹ năng',
                destructiveButtonIndex: -1,
            },
            (buttonIndex) => {
                console.log('ActionSheet callback - buttonIndex:', buttonIndex);
                
                if (buttonIndex === 0) {
                    console.log('Cancel pressed');
                    return;
                }
                
                if (buttonIndex > 0 && buttonIndex <= skills.length) {
                    const skillToAdd = skills[buttonIndex - 1];
                    console.log('Skill to add:', skillToAdd);
                    
                    // Check if skill is already selected
                    const isAlreadySelected = localSkillTags.some(existingSkill => existingSkill.id === skillToAdd.id);
                    
                    if (isAlreadySelected) {
                        Alert.alert('Thông báo', 'Kỹ năng này đã được chọn');
                        return;
                    }
                    
                    // Add to local state and call parent callback
                    const updatedSkills = [...localSkillTags, skillToAdd];
                    setLocalSkillTags(updatedSkills);
                    onAddSkill && onAddSkill(skillToAdd, updatedSkills);
                }
            }
        );
    };

    const handleSkillSelect = (skill) => {
        console.log('Modal skill selected:', skill);
        
        // Check if skill is already selected
        const isAlreadySelected = localSkillTags.some(existingSkill => existingSkill.id === skill.id);
        
        if (isAlreadySelected) {
            Alert.alert('Thông báo', 'Kỹ năng này đã được chọn');
            setIsModalVisible(false);
            return;
        }
        
        // Add to local state and call parent callback
        const updatedSkills = [...localSkillTags, skill];
        setLocalSkillTags(updatedSkills);
        onAddSkill && onAddSkill(skill, updatedSkills);
        setIsModalVisible(false);
    };

    const handleAddSkill = () => {
        console.log('Android add skill, selectedSkill:', selectedSkill);
        
        if (selectedSkill) {
            const skillToAdd = skills.find(skill => skill.id === selectedSkill);
            console.log('Found skill to add:', skillToAdd);
            
            if (skillToAdd) {
                // Check if skill is already selected
                const isAlreadySelected = localSkillTags.some(existingSkill => existingSkill.id === skillToAdd.id);
                
                if (isAlreadySelected) {
                    Alert.alert('Thông báo', 'Kỹ năng này đã được chọn');
                    return;
                }
                
                // Add to local state and call parent callback
                const updatedSkills = [...localSkillTags, skillToAdd];
                setLocalSkillTags(updatedSkills);
                onAddSkill && onAddSkill(skillToAdd, updatedSkills);
                setSelectedSkill(''); // Reset the picker
            }
        } else {
            Alert.alert('Thông báo', 'Vui lòng chọn một kỹ năng');
        }
    };

    const handleRemoveSkill = (index) => {
        console.log('Removing skill at index:', index);
        if (index < 0 || index >= localSkillTags.length) {
            console.error('Invalid index for skill removal:', index);
            return;
        }
        const skillToRemove = localSkillTags[index];
        console.log('Skill to remove:', skillToRemove);
        const updatedSkills = localSkillTags.filter((_, i) => i !== index);
        setLocalSkillTags(updatedSkills);
        onRemoveSkill && onRemoveSkill(skillToRemove, updatedSkills);
        console.log('Updated skills after removal:', updatedSkills);
    };

    const renderSkillModal = () => (
        <Modal
            visible={isModalVisible}
            animationType="slide"
            presentationStyle="pageSheet"
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Chọn kỹ năng</Text>
                    <TouchableOpacity 
                        style={styles.closeButton}
                        onPress={() => setIsModalVisible(false)}
                    >
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={skills}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => {
                        const isSelected = localSkillTags.some(skill => skill.id === item.id);
                        return (
                            <TouchableOpacity
                                style={[
                                    styles.skillOption,
                                    isSelected && styles.selectedSkillOption
                                ]}
                                onPress={() => handleSkillSelect(item)}
                                disabled={isSelected}
                            >
                                <Text style={[
                                    styles.skillOptionText,
                                    isSelected && styles.selectedSkillOptionText
                                ]}>
                                    {item.skillName || item.name}
                                </Text>
                                {isSelected && (
                                    <Ionicons name="checkmark" size={20} color="#32CD32" />
                                )}
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>
        </Modal>
    );

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kỹ năng</Text>
            
            <View style={styles.addItemContainer}>
                {Platform.OS === 'ios' ? (
                    <TouchableOpacity 
                        style={styles.skillSelector}
                        onPress={selectSkill}
                    >
                        <Text style={styles.selectorText}>Chọn kỹ năng...</Text>
                        <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                ) : (
                    <>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={selectedSkill}
                                onValueChange={(itemValue) => {
                                    console.log('Picker value changed:', itemValue);
                                    setSelectedSkill(itemValue);
                                }}
                                style={styles.picker}
                            >
                                <Picker.Item label="Chọn kỹ năng..." value="" />
                                {skills.map((skill) => (
                                    <Picker.Item 
                                        key={skill.id} 
                                        label={skill.skillName || skill.name} 
                                        value={skill.id} 
                                    />
                                ))}
                            </Picker>
                        </View>
                        <TouchableOpacity style={styles.addButton} onPress={handleAddSkill}>
                            <Ionicons name="add" size={20} color="white" />
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {/* Display selected skills using localSkillTags */}
            {localSkillTags && localSkillTags.map((skill, index) => (
                <View key={skill.id || index} style={styles.skillItem}>
                    <Text style={styles.skillText}>
                        {renderSkillText ? renderSkillText(skill) : (skill.skillName || skill.name)}
                    </Text>
                    <TouchableOpacity onPress={() => handleRemoveSkill(index)}>
                        <Ionicons name="close-circle" size={20} color="#FF6B6B" />
                    </TouchableOpacity>
                </View>
            ))}

            {renderSkillModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#2558B6",
        borderLeftWidth: 4,
        borderLeftColor: "#FF7345",
        paddingLeft: 10,
        marginBottom: 20,
    },
    addItemContainer: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 15,
        alignItems: "center",
    },
    skillSelector: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: "#E0E0E0",
        borderRadius: 8,
        backgroundColor: "#FAFAFA",
        padding: 12,
        height: 48,
    },
    selectorText: {
        fontSize: 16,
        color: "#666",
    },
    pickerContainer: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#E0E0E0",
        borderRadius: 8,
        backgroundColor: "#FAFAFA",
    },
    picker: {
        height: 48,
        color: "#333",
    },
    addButton: {
        backgroundColor: "#2558B6",
        padding: 12,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        width: 50,
    },
    skillItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 12,
        backgroundColor: "#F0F8FF",
        borderRadius: 8,
        marginBottom: 8,
    },
    skillText: {
        fontSize: 16,
        color: "#2558B6",
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "white",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#2558B6",
    },
    closeButton: {
        padding: 5,
    },
    skillOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    skillOptionText: {
        fontSize: 16,
        color: "#333",
    },
    selectedSkillOption: {
        backgroundColor: "#F0FFF0",
        opacity: 0.7,
    },
    selectedSkillOptionText: {
        color: "#32CD32",
        fontWeight: "600",
    },
});

export default SkillsForm ;