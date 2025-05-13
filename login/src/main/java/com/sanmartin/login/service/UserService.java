package com.sanmartin.login.service;

import com.sanmartin.login.dto.RoleUpdateDto;
import com.sanmartin.login.dto.UserUpdateDto;
import com.sanmartin.login.model.Role;
import com.sanmartin.login.model.User;
import com.sanmartin.login.model.UserRole;
import com.sanmartin.login.repository.RoleRepository;
import com.sanmartin.login.repository.UserRepository;
import com.sanmartin.login.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
    }

    @Transactional
    public User updateUser(Long id, UserUpdateDto userRequest) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
        
        userRepository.findByEmail(userRequest.getEmail())
                .filter(user -> !user.getId().equals(id))
                .ifPresent(user -> {
                    throw new RuntimeException("El correo electrónico ya está en uso");
                });

        userRepository.findByUsername(userRequest.getUsername())
                .filter(user -> !user.getId().equals(id))
                .ifPresent(user -> {
                    throw new RuntimeException("El nombre de usuario ya está en uso");
                });
        
        existingUser.setNombre(userRequest.getNombre());
        existingUser.setApellidoPaterno(userRequest.getApellidoPaterno());
        existingUser.setApellidoMaterno(userRequest.getApellidoMaterno());
        existingUser.setEmail(userRequest.getEmail());
        existingUser.setUsername(userRequest.getUsername());
        
        if (userRequest.getPassword() != null && !userRequest.getPassword().isEmpty()) {
            existingUser.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        }

        
        return userRepository.save(existingUser);
    }

    @Transactional
    public void deleteUser(Long id) {
        User currentUser = authService.getCurrentUser();
        User userToDelete = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
        
        if (currentUser.getId().equals(userToDelete.getId())) {
            throw new AccessDeniedException("No puedes eliminar tu propia cuenta");
        }

        userToDelete.setEstado(false);
        userRepository.save(userToDelete);
    }

    @Transactional
    public void deleteUserPermanently(Long id) {
        User currentUser = authService.getCurrentUser();
        User userToDelete = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
        
        if (currentUser.getId().equals(userToDelete.getId())) {
            throw new AccessDeniedException("No puedes eliminar tu propia cuenta");
        }
        
        userRepository.deleteById(id);
    }
    
    @Transactional
    public User activateUser(Long id) {
        User userToActivate = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
        
        userToActivate.setEstado(true);
        return userRepository.save(userToActivate);
    }

    @Transactional
    public User updateUserRoles(Long userId, RoleUpdateDto roleUpdateDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + userId));
        
        User currentUser = authService.getCurrentUser();
        if (currentUser.getId().equals(userId)) {
            throw new AccessDeniedException("No puedes modificar tus propios roles");
        }
        
        List<UserRole> existingRoles = new ArrayList<>(user.getUserRoles());
        userRoleRepository.deleteAll(existingRoles);
        user.getUserRoles().clear();
        
        List<UserRole> newRoles = new ArrayList<>();
        for (String roleName : roleUpdateDto.getRoles()) {
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new RuntimeException("Rol no encontrado: " + roleName));
            
            UserRole userRole = UserRole.builder()
                    .user(user)
                    .role(role)
                    .build();
            
            newRoles.add(userRoleRepository.save(userRole));
        }
        
        user.setUserRoles(newRoles);
        return userRepository.save(user);
    }
}
