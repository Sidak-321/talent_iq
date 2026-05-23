export const DEFAULT_QUESTIONS = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    category: "Array • Hash Table",
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: `Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

Input: nums = [3,2,4], target = 6
Output: [1,2]

Input: nums = [3,3], target = 6
Output: [0,1]`,
    starterCode: {
      javascript: `function twoSum(nums, target) {
    // Write your JavaScript code here
    
}`,
      python: `def two_sum(nums, target):
    # Write your Python code here
    pass`,
      cpp: `#include <vector>

std::vector<int> twoSum(std::vector<int>& nums, int target) {
    // Write your C++ code here
    
}`
    }
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Easy",
    category: "String • Stack",
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    examples: `Input: s = "()"
Output: true

Input: s = "()[]{}"
Output: true

Input: s = "(]"
Output: false`,
    starterCode: {
      javascript: `function isValid(s) {
    // Write your JavaScript code here
    
}`,
      python: `def is_valid(s):
    # Write your Python code here
    pass`,
      cpp: `#include <string>

bool isValid(std::string s) {
    // Write your C++ code here
    
}`
    }
  },
  {
    id: "longest-substring",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    category: "String • Sliding Window",
    description: `Given a string \`s\`, find the length of the longest substring without repeating characters.`,
    examples: `Input: s = "abcabcbb"
Output: 3
Explanation: The answer is "abc", with the length of 3.

Input: s = "bbbbb"
Output: 1
Explanation: The answer is "b", with the length of 1.`,
    starterCode: {
      javascript: `function lengthOfLongestSubstring(s) {
    // Write your JavaScript code here
    
}`,
      python: `def length_of_longest_substring(s):
    # Write your Python code here
    pass`,
      cpp: `#include <string>

int lengthOfLongestSubstring(std::string s) {
    // Write your C++ code here
    
}`
    }
  },
  {
    id: "reverse-string",
    title: "Reverse String",
    difficulty: "Easy",
    category: "String • Two Pointers",
    description: `Write a function that reverses a string. The input string is given as an array of characters \`s\`.

You must do this by modifying the input array in-place with O(1) extra memory.`,
    examples: `Input: s = ["h","e","l","l","o"]
Output: ["o","l","l","e","h"]`,
    starterCode: {
      javascript: `function reverseString(s) {
    // Modify s in-place
    
}`,
      python: `def reverse_string(s):
    # Modify s in-place
    pass`,
      cpp: `#include <vector>

void reverseString(std::vector<char>& s) {
    // Modify s in-place
    
}`
    }
  }
];
