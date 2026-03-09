import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ExpenseListScreen from '../screens/expenses/ExpenseListScreen';
import AddExpenseScreen from '../screens/expenses/AddExpenseScreen';
import ExpenseDetailScreen from '../screens/expenses/ExpenseDetailScreen';
import ExpenseCorrectionScreen from '../screens/expenses/ExpenseCorrectionScreen';
import { COLORS } from '../config/theme';

export type ExpensesStackParamList = {
  ExpenseList: undefined;
  AddExpense: undefined;
  ExpenseDetail: { expenseId: string };
  ExpenseCorrection: { expenseId: string };
};

const Stack = createNativeStackNavigator<ExpensesStackParamList>();

const ExpensesStackNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerTintColor: COLORS.primary,
      headerTitleStyle: { color: COLORS.text },
    }}
  >
    <Stack.Screen name="ExpenseList" component={ExpenseListScreen} options={{ title: 'Gastos' }} />
    <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Nuevo gasto' }} />
    <Stack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} options={{ title: 'Detalle gasto' }} />
    <Stack.Screen name="ExpenseCorrection" component={ExpenseCorrectionScreen} options={{ title: 'Corregir gasto' }} />
  </Stack.Navigator>
);

export default ExpensesStackNavigator;
