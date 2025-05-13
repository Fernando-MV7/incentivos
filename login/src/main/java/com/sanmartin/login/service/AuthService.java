package com.sanmartin.login.service;

import com.sanmartin.login.config.JwtService;
import com.sanmartin.login.dto.AuthResponseDto;
import com.sanmartin.login.dto.LoginRequestDto;
import com.sanmartin.login.dto.UserRequestDto;
import com.sanmartin.login.model.Role;
import com.sanmartin.login.model.User;
import com.sanmartin.login.model.UserRole;
import com.sanmartin.login.repository.RoleRepository;
import com.sanmartin.login.repository.UserRepository;
import com.sanmartin.login.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService implements UserDetailsService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));
    }

    @Transactional
    public User registerUser(UserRequestDto userRequest, boolean isAdmin) {

        if (userRepository.existsByUsername(userRequest.getUsername())) {
            throw new RuntimeException("El nombre de usuario ya está en uso");
        }

        if (userRepository.existsByEmail(userRequest.getEmail())) {
            throw new RuntimeException("El correo electrónico ya está en uso");
        }

        User user = User.builder()
                .nombre(userRequest.getNombre())
                .apellidoPaterno(userRequest.getApellidoPaterno())
                .apellidoMaterno(userRequest.getApellidoMaterno())
                .email(userRequest.getEmail())
                .username(userRequest.getUsername())
                .password(passwordEncoder.encode(userRequest.getPassword()))
                .estado(true)
                .userRoles(new ArrayList<>())
                .build();

        User savedUser = userRepository.save(user);

        Role userRole = roleRepository.findByName("USER")
                .orElseThrow(() -> new RuntimeException("Rol no encontrado: USER"));
        
        UserRole newUserRole = UserRole.builder()
                .user(savedUser)
                .role(userRole)
                .build();
        
        userRoleRepository.save(newUserRole);

        if (isAdmin) {
            Role adminRole = roleRepository.findByName("ADMIN")
                    .orElseThrow(() -> new RuntimeException("Rol no encontrado: ADMIN"));
            
            UserRole adminUserRole = UserRole.builder()
                    .user(savedUser)
                    .role(adminRole)
                    .build();
            
            userRoleRepository.save(adminUserRole);
        }

        return savedUser;
    }

    public AuthResponseDto authenticate(LoginRequestDto loginRequest) {
        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));
        
        if (!user.getEstado()) {
                throw new RuntimeException("Usuario inactivo. Contacte al administrador.");
        }

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new RuntimeException("Credenciales inválidas");
        }
        
        String token = jwtService.generateToken(user);
        String role = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));
        
        return AuthResponseDto.builder()
                .token(token)
                .username(user.getUsername())
                .role(role)
                .estado(user.getEstado())
                .build();
    }

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));
    }
}
