import React from 'react';
import { Text, View } from 'react-native';
import tw from 'twrnc'; 

function HomeLogin() {
  return (
    <View style={tw`bg-[#95D5B2] h-full justify-center items-center`}>
      <Text style={tw`text-5xl font-bold text-[#1B4332] text-center`}>
        Inicio de sesión Exitoso
      </Text>
    </View>
  );
}

export default HomeLogin;
