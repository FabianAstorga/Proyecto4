using Microsoft.EntityFrameworkCore;
using WebGIS.Server.Models;

namespace WebGIS.Server.Data;

public sealed class WebGisDbContext(DbContextOptions<WebGisDbContext> options)
    : DbContext(options)
{
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Sector> Sectores => Set<Sector>();
    public DbSet<Vuelo> Vuelos => Set<Vuelo>();
    public DbSet<Fotografia> Fotografias => Set<Fotografia>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.HasDefaultSchema("epa");

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.ToTable("usuario");
            entity.HasKey(x => x.IdUsuario);
            entity.Property(x => x.IdUsuario)
                .HasColumnName("id_usuario")
                .UseIdentityAlwaysColumn();
            entity.Property(x => x.Nombre).HasColumnName("nombre").HasMaxLength(120).IsRequired();
            entity.Property(x => x.Email).HasColumnName("email").HasMaxLength(254).IsRequired();
            entity.Property(x => x.Rol).HasColumnName("rol").HasMaxLength(20).IsRequired();
            entity.Property(x => x.PasswordHash)
                .HasColumnName("password_hash")
                .HasMaxLength(255)
                .IsRequired();
            entity.Property(x => x.Activo).HasColumnName("activo");
            entity.Property(x => x.FechaCreacion).HasColumnName("fecha_creacion");
            entity.Property(x => x.UltimoAcceso).HasColumnName("ultimo_acceso");
        });

        modelBuilder.Entity<Sector>(entity =>
        {
            entity.ToTable("sector");
            entity.HasKey(x => x.IdSector);
            entity.Property(x => x.IdSector)
                .HasColumnName("id_sector")
                .UseIdentityAlwaysColumn();
            entity.Property(x => x.Codigo).HasColumnName("codigo").HasMaxLength(30).IsRequired();
        });

        modelBuilder.Entity<Vuelo>(entity =>
        {
            entity.ToTable("vuelo");
            entity.HasKey(x => x.IdVuelo);
            entity.Property(x => x.IdVuelo)
                .HasColumnName("id_vuelo")
                .UseIdentityAlwaysColumn();
            entity.Property(x => x.CodigoVuelo)
                .HasColumnName("codigo_vuelo")
                .HasMaxLength(50)
                .IsRequired();
            entity.Property(x => x.FechaInicio).HasColumnName("fecha_inicio");
            entity.Property(x => x.EstadoCarga)
                .HasColumnName("estado_carga")
                .HasMaxLength(30)
                .IsRequired();
            entity.Property(x => x.TotalArchivos).HasColumnName("total_archivos");
            entity.Property(x => x.IdSector).HasColumnName("id_sector");
            entity.Property(x => x.IdUsuario).HasColumnName("id_usuario");

            entity.HasOne(x => x.Sector)
                .WithMany(x => x.Vuelos)
                .HasForeignKey(x => x.IdSector);
            entity.HasOne(x => x.Usuario)
                .WithMany()
                .HasForeignKey(x => x.IdUsuario);
            entity.HasMany(x => x.Fotografias)
                .WithOne(x => x.Vuelo)
                .HasForeignKey(x => x.IdVuelo)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Fotografia>(entity =>
        {
            entity.ToTable("fotografia");
            entity.HasKey(x => x.IdFoto);
            entity.Property(x => x.IdFoto)
                .HasColumnName("id_foto")
                .UseIdentityAlwaysColumn();
            entity.Property(x => x.NombreArchivo)
                .HasColumnName("nombre_archivo")
                .HasMaxLength(255)
                .IsRequired();
            entity.Property(x => x.FechaCaptura).HasColumnName("fecha_captura");
            entity.Property(x => x.IdVuelo).HasColumnName("id_vuelo");
            entity.Property(x => x.RutaRelativa)
                .HasColumnName("ruta_relativa")
                .HasMaxLength(500);
            entity.Property(x => x.MimeType)
                .HasColumnName("mime_type")
                .HasMaxLength(100);
            entity.Property(x => x.TamanoBytes).HasColumnName("tamano_bytes");
            entity.Property(x => x.AnchoPx).HasColumnName("ancho_px");
            entity.Property(x => x.AltoPx).HasColumnName("alto_px");
            entity.Property(x => x.HashSha256)
                .HasColumnName("hash_sha256")
                .HasColumnType("char(64)");
            entity.Property(x => x.FechaCarga)
                .HasColumnName("fecha_carga")
                .HasDefaultValueSql("now()");
        });
    }
}
