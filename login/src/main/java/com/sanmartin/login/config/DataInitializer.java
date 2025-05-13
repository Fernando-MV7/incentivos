package com.sanmartin.login.config;
import com.sanmartin.login.model.Role;
import com.sanmartin.login.model.User;
import com.sanmartin.login.model.UserRole;
import com.sanmartin.login.repository.RoleRepository;
import com.sanmartin.login.repository.UserRepository;
import com.sanmartin.login.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        System.out.println("Inicializando datos...");
        
        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setName("ADMIN");
                    return roleRepository.save(role);
                });
                
        Role userRole = roleRepository.findByName("USER")
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setName("USER");
                    return roleRepository.save(role);
                });
        
        System.out.println("Roles creados o recuperados correctamente");

        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                    .nombre("Admin")
                    .apellidoPaterno("System")
                    .apellidoMaterno("Admin")
                    .email("admin@example.com")
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .estado(true)
                    .userRoles(new ArrayList<>())
                    .build();
            
            User savedAdmin = userRepository.save(admin);
            System.out.println("Usuario admin creado con ID: " + savedAdmin.getId());
            
            UserRole adminUserRole = UserRole.builder()
                    .user(savedAdmin)
                    .role(adminRole)
                    .build();
            
            userRoleRepository.save(adminUserRole);
            System.out.println("Rol ADMIN asignado al usuario admin");

            UserRole userUserRole = UserRole.builder()
                    .user(savedAdmin)
                    .role(userRole)
                    .build();
            
            userRoleRepository.save(userUserRole);
            System.out.println("Rol USER asignado al usuario admin");
        } else {
            System.out.println("El usuario admin ya existe");
        }
        
        System.out.println("Inicialización de datos completada con éxito");
    }
}